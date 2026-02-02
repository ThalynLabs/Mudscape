import bcrypt from "bcrypt";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import { storage } from "./storage";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

const SALT_ROUNDS = 10;

export interface AuthUser {
  id: string;
  username: string;
  isAdmin: boolean;
  claims?: { sub: string };
}

declare module "express-session" {
  interface SessionData {
    userId?: string;
    isAdmin?: boolean;
  }
}

declare module "express-serve-static-core" {
  interface Request {
    authUser?: AuthUser;
  }
}

const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
});

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
});

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function setupAuth(app: Express): void {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const PgSession = connectPgSimple(session);

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET environment variable is required in production");
  }
  if (!sessionSecret) {
    console.warn("WARNING: SESSION_SECRET not set. Using insecure default for development only.");
  }

  app.use(
    session({
      store: new PgSession({
        pool,
        tableName: "sessions",
        createTableIfMissing: true,
      }),
      secret: sessionSecret || "mudscape-dev-secret-insecure",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      },
    })
  );

  app.use(async (req: Request, res: Response, next: NextFunction) => {
    if (req.session.userId) {
      const dbUser = await storage.getUser(req.session.userId);
      if (dbUser && dbUser.username) {
        req.authUser = {
          id: dbUser.id,
          username: dbUser.username,
          isAdmin: dbUser.isAdmin || false,
          claims: { sub: dbUser.id },
        };
      }
    }
    next();
  });
}

export async function isAuthenticated(req: Request, res: Response, next: NextFunction): Promise<void> {
  const config = await storage.getAppConfig();
  
  if (config?.accountMode === "single") {
    req.authUser = {
      id: "single-user",
      username: "user",
      isAdmin: true,
      claims: { sub: "single-user" },
    };
    return next();
  }
  
  if (req.session.userId && req.authUser) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
}

export function isAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.authUser?.isAdmin) {
    return next();
  }
  res.status(403).json({ message: "Admin access required" });
}

export function registerAuthRoutes(app: Express): void {
  app.get("/api/auth/status", async (req, res) => {
    const config = await storage.getAppConfig();
    
    if (config?.accountMode === "single") {
      return res.json({
        authenticated: true,
        accountMode: "single",
        user: { id: "single-user", username: "user", isAdmin: true },
      });
    }
    
    if (req.session.userId && req.authUser) {
      return res.json({
        authenticated: true,
        accountMode: config?.accountMode || "multi",
        user: {
          id: req.authUser.id,
          username: req.authUser.username,
          isAdmin: req.authUser.isAdmin,
        },
      });
    }
    
    res.json({ 
      authenticated: false, 
      accountMode: config?.accountMode || "multi",
      registrationEnabled: config?.registrationEnabled ?? true,
    });
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const config = await storage.getAppConfig();
      
      if (config?.accountMode === "single") {
        return res.status(400).json({ message: "Registration disabled in single-user mode" });
      }
      
      if (config?.installed && !config.registrationEnabled) {
        return res.status(403).json({ message: "Registration is disabled" });
      }

      const input = registerSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(input.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already taken" });
      }

      const passwordHash = await hashPassword(input.password);
      const userCount = await storage.getUserCount();
      const isFirstUser = userCount === 0;

      const user = await storage.createUser({
        id: uuidv4(),
        username: input.username,
        passwordHash,
        isAdmin: isFirstUser,
      });

      if (isFirstUser && !config?.installed) {
        await storage.createAppConfig({ installed: true });
      } else if (isFirstUser && config) {
        await storage.updateAppConfig({ installed: true });
      }

      req.session.userId = user.id;
      req.session.isAdmin = user.isAdmin || false;
      
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.status(201).json({
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      console.error("Registration error:", e);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const config = await storage.getAppConfig();
      
      if (config?.accountMode === "single") {
        return res.status(400).json({ message: "Login not required in single-user mode" });
      }

      const input = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(input.username);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      const valid = await verifyPassword(input.password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      req.session.userId = user.id;
      req.session.isAdmin = user.isAdmin || false;
      
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.json({
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      console.error("Login error:", e);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/user", isAuthenticated, (req, res) => {
    res.json({
      id: req.authUser!.id,
      username: req.authUser!.username,
      isAdmin: req.authUser!.isAdmin,
    });
  });

  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    const users = await storage.getUsers();
    res.json(users.map(u => ({
      id: u.id,
      username: u.username,
      isAdmin: u.isAdmin,
      createdAt: u.createdAt,
    })));
  });

  app.post("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const input = registerSchema.parse(req.body);
      const isAdmin = req.body.isAdmin === true;
      
      const existingUser = await storage.getUserByUsername(input.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already taken" });
      }

      const passwordHash = await hashPassword(input.password);
      const user = await storage.createUser({
        id: uuidv4(),
        username: input.username,
        passwordHash,
        isAdmin,
      });

      res.status(201).json({
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      console.error("Create user error:", e);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/admin/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = req.params.id as string;
      const dbUser = await storage.getUser(userId);
      
      if (!dbUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const updates: Record<string, unknown> = {};
      
      if (req.body.username !== undefined) {
        const existingUser = await storage.getUserByUsername(req.body.username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(409).json({ message: "Username already taken" });
        }
        updates.username = req.body.username;
      }
      
      if (req.body.password !== undefined && req.body.password.length >= 6) {
        updates.passwordHash = await hashPassword(req.body.password);
      }
      
      if (req.body.isAdmin !== undefined) {
        if (req.authUser!.id === userId && req.body.isAdmin === false) {
          return res.status(400).json({ message: "Cannot remove your own admin status" });
        }
        updates.isAdmin = req.body.isAdmin;
      }

      const updated = await storage.updateUser(userId, updates);
      
      res.json({
        id: updated.id,
        username: updated.username,
        isAdmin: updated.isAdmin,
      });
    } catch (e) {
      console.error("Update user error:", e);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = req.params.id as string;
      
      if (req.authUser!.id === userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const dbUser = await storage.getUser(userId);
      if (!dbUser) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.deleteUser(userId);
      res.status(204).send();
    } catch (e) {
      console.error("Delete user error:", e);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.get("/api/admin/config", isAuthenticated, isAdmin, async (req, res) => {
    const config = await storage.getAppConfig();
    res.json(config || { accountMode: "multi", registrationEnabled: true, appName: "Mudscape", installed: false });
  });

  app.put("/api/admin/config", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const updates: Record<string, unknown> = {};
      
      if (req.body.accountMode !== undefined) {
        updates.accountMode = req.body.accountMode;
      }
      if (req.body.registrationEnabled !== undefined) {
        updates.registrationEnabled = req.body.registrationEnabled;
      }
      if (req.body.appName !== undefined) {
        updates.appName = req.body.appName;
      }

      const config = await storage.updateAppConfig(updates);
      res.json(config);
    } catch (e) {
      console.error("Update config error:", e);
      res.status(500).json({ message: "Failed to update configuration" });
    }
  });

  app.get("/api/install/status", async (req, res) => {
    const config = await storage.getAppConfig();
    const userCount = await storage.getUserCount();
    
    res.json({
      installed: config?.installed ?? false,
      hasUsers: userCount > 0,
      accountMode: config?.accountMode ?? "multi",
    });
  });

  app.post("/api/install/setup", async (req, res) => {
    try {
      const config = await storage.getAppConfig();
      if (config?.installed) {
        return res.status(400).json({ message: "Already installed" });
      }

      const userCount = await storage.getUserCount();
      if (userCount > 0) {
        return res.status(400).json({ message: "Users already exist" });
      }

      const { accountMode, appName, adminUsername, adminPassword } = req.body;
      
      if (accountMode === "multi") {
        if (!adminUsername || !adminPassword) {
          return res.status(400).json({ message: "Admin credentials required for multi-user mode" });
        }
        
        if (adminUsername.length < 3) {
          return res.status(400).json({ message: "Username must be at least 3 characters" });
        }
        
        if (adminPassword.length < 6) {
          return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const passwordHash = await hashPassword(adminPassword);
        const user = await storage.createUser({
          id: uuidv4(),
          username: adminUsername,
          passwordHash,
          isAdmin: true,
        });

        req.session.userId = user.id;
        req.session.isAdmin = true;
        
        await new Promise<void>((resolve, reject) => {
          req.session.save((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }

      await storage.updateAppConfig({
        accountMode: accountMode || "multi",
        appName: appName || "Mudscape",
        installed: true,
      });

      res.json({ success: true, accountMode });
    } catch (e) {
      console.error("Setup error:", e);
      res.status(500).json({ message: "Setup failed" });
    }
  });
}
