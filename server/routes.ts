import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import * as net from "net";
import OpenAI from "openai";
import { setupAuth, registerAuthRoutes, isAuthenticated, isAdmin, aiLimiter } from "./auth";
import { setSocketIO } from "./index";
import { startUpdateChecker, getUpdateInfo, checkForUpdates, installUpdate } from "./update-checker";

// Telnet constants
const IAC = 255;
const WILL = 251;
const WONT = 252;
const DO = 253;
const DONT = 254;
const SB = 250;
const SE = 240;
const GMCP = 201;

// Type for incoming WebSocket messages
type WsClientMessage = 
  | { type: 'connect'; host: string; port: number; encoding?: string; gmcp?: boolean }
  | { type: 'disconnect' }
  | { type: 'send'; data: string }
  | { type: 'gmcp'; module: string; data: unknown };

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup auth BEFORE other routes
  setupAuth(app);
  registerAuthRoutes(app);
  
  // Helper to get user ID from request (returns null if not authenticated)
  const getUserId = (req: any): string | null => {
    return req.authUser?.claims?.sub ?? null;
  };

  // === PROFILE ROUTES (protected by auth) ===
  app.get(api.profiles.list.path, isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req);
    const profiles = await storage.getProfilesByUser(userId!);
    res.json(profiles);
  });

  app.get(api.profiles.get.path, isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req);
    const profile = await storage.getProfile(Number(req.params.id));
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    // Check ownership
    if (profile.userId && profile.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    res.json(profile);
  });

  app.post(api.profiles.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const input = api.profiles.create.input.parse(req.body);
      const profile = await storage.createProfile({ ...input, userId });
      res.status(201).json(profile);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      throw e;
    }
  });

  app.put(api.profiles.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const existing = await storage.getProfile(Number(req.params.id));
      if (!existing) return res.status(404).json({ message: "Profile not found" });
      if (existing.userId && existing.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const input = api.profiles.update.input.parse(req.body);
      const profile = await storage.updateProfile(Number(req.params.id), input);
      res.json(profile);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      throw e;
    }
  });

  app.delete(api.profiles.delete.path, isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req);
    const existing = await storage.getProfile(Number(req.params.id));
    if (!existing) return res.status(404).json({ message: "Profile not found" });
    if (existing.userId && existing.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    await storage.deleteProfile(Number(req.params.id));
    res.status(204).send();
  });

  // === SOUNDPACKS ROUTES ===
  app.get(api.soundpacks.list.path, async (req, res) => {
    const soundpacksList = await storage.getSoundpacks();
    res.json(soundpacksList);
  });

  app.get(api.soundpacks.get.path, async (req, res) => {
    const soundpack = await storage.getSoundpack(Number(req.params.id));
    if (!soundpack) return res.status(404).json({ message: "Soundpack not found" });
    res.json(soundpack);
  });

  app.post(api.soundpacks.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.soundpacks.create.input.parse(req.body);
      const soundpack = await storage.createSoundpack(input);
      res.status(201).json(soundpack);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      throw e;
    }
  });

  app.put(api.soundpacks.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.soundpacks.update.input.parse(req.body);
      const soundpack = await storage.updateSoundpack(Number(req.params.id), input);
      if (!soundpack) return res.status(404).json({ message: "Soundpack not found" });
      res.json(soundpack);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      throw e;
    }
  });

  app.delete(api.soundpacks.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteSoundpack(Number(req.params.id));
    res.status(204).send();
  });

  // === PACKAGE ROUTES ===
  app.get(api.packages.list.path, async (req, res) => {
    const packagesList = await storage.getPackages();
    res.json(packagesList);
  });

  app.get(api.packages.get.path, async (req, res) => {
    const pkg = await storage.getPackage(Number(req.params.id));
    if (!pkg) return res.status(404).json({ message: "Package not found" });
    res.json(pkg);
  });

  app.post(api.packages.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.packages.create.input.parse(req.body);
      const pkg = await storage.createPackage(input);
      res.status(201).json(pkg);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      throw e;
    }
  });

  app.delete(api.packages.delete.path, isAuthenticated, async (req, res) => {
    await storage.deletePackage(Number(req.params.id));
    res.status(204).send();
  });

  // === GLOBAL SETTINGS ROUTES ===
  app.get(api.settings.get.path, async (req, res) => {
    const settings = await storage.getGlobalSettings();
    res.json(settings);
  });

  app.put(api.settings.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.settings.update.input.parse(req.body);
      const settings = await storage.updateGlobalSettings(input);
      res.json(settings);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      throw e;
    }
  });

  // === UPDATE CHECK ===
  startUpdateChecker();

  app.get('/api/update-check', isAuthenticated, async (_req, res) => {
    res.json(getUpdateInfo());
  });

  app.post('/api/update-check', isAuthenticated, async (_req, res) => {
    const info = await checkForUpdates();
    res.json(info);
  });

  app.post('/api/update-install', isAuthenticated, isAdmin, async (_req, res) => {
    const steps: any[] = [];
    try {
      const result = await installUpdate((progress) => {
        steps.push(progress);
      });
      res.json({ steps, result });
    } catch (err: any) {
      res.status(500).json({ steps, result: { status: "error", message: err.message || "Unknown error" } });
    }
  });

  app.post('/api/restart', isAuthenticated, isAdmin, async (_req, res) => {
    res.json({ message: "Server restarting..." });
    setTimeout(() => {
      console.log("Restart requested by admin. Exiting process...");
      process.exit(0);
    }, 1000);
  });

  // === AI SCRIPT GENERATION ===
  app.post('/api/ai/generate-script', isAuthenticated, aiLimiter, async (req, res) => {
    try {
      const { description, context, apiKey } = req.body;
      
      if (!description || !apiKey) {
        return res.status(400).json({ message: 'Description and API key are required' });
      }

      const contextHints: Record<string, string> = {
        trigger: `This is a trigger script that runs when incoming MUD text matches a pattern.
The 'line' variable contains the matched text.
The 'matches' table contains regex capture groups (matches[0] = full match, matches[1] = first capture, etc.).`,
        alias: `This is an alias script that runs when the user types a command matching a pattern.
The 'line' variable contains the user's original input.
The 'matches' table contains regex capture groups.`,
        timer: `This is a timer script that runs at regular intervals.
No line or matches variables are available.
Good for periodic automation like auto-healing.`,
        keybinding: `This is a keybinding script that runs when the user presses a key combination.
No line or matches variables are available.
Good for quick commands.`,
      };

      const systemPrompt = `You are a Lua scripting assistant for MUD (Multi-User Dungeon) games.
You write scripts for the Mudscape MUD client which uses Lua 5.4.

Available API functions:
- send(command) - Send a command to the MUD server
- echo(text) - Display text locally in the terminal (shown in yellow)
- setVariable(name, value) - Store a persistent variable (string, number, boolean, or nil)
- getVariable(name) - Retrieve a stored variable
- playSound(name, volume, loop) - Play a sound (volume 0-1, loop is boolean)
- stopSound(name) - Stop a playing sound
- loopSound(name, volume) - Start looping a sound
- setSoundPosition(name, x, y, z) - Set 3D position for spatial audio

${contextHints[context] || contextHints.trigger}

Guidelines:
- Write clean, minimal Lua code
- Use only the available API functions
- Don't include unnecessary comments
- Match patterns using Lua string patterns if needed
- Return only the Lua code, no explanations`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: description },
          ],
          max_tokens: 500,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return res.status(response.status).json({ 
          message: error.error?.message || 'OpenAI API error' 
        });
      }

      const data = await response.json();
      let script = data.choices[0]?.message?.content || '';
      
      // Clean up the response - remove markdown code blocks if present
      script = script.replace(/^```lua\n?/i, '').replace(/^```\n?/, '').replace(/\n?```$/g, '').trim();

      res.json({ script });
    } catch (e) {
      console.error('AI script generation error:', e);
      res.status(500).json({ message: 'Failed to generate script' });
    }
  });

  // === AI SCRIPT ASSISTANT (Conversational) ===
  // Users provide their own OpenAI API key to use the wizard
  app.post('/api/ai/script-assistant', isAuthenticated, aiLimiter, async (req, res) => {
    try {
      const { messages, systemPrompt, apiKey } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: 'Messages array is required' });
      }

      if (!apiKey) {
        return res.status(400).json({ 
          message: 'API key required. Please add your OpenAI API key in Settings to use the Script Assistant.',
          needsApiKey: true,
        });
      }

      const openai = new OpenAI({ apiKey });

      // Set up SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const stream = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: true,
        max_tokens: 4096,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (e) {
      console.error('AI script assistant error:', e);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: 'Failed to get response' })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ message: 'Failed to process request' });
      }
    }
  });

  // === SOCKET.IO MUD RELAY ===
  // Using Socket.IO for better proxy support (HTTP polling fallback)
  // Force polling first as Replit's proxy may not forward WebSocket upgrades on custom paths
  // Use /api/socket path to avoid Replit proxy interference
  const isProduction = process.env.NODE_ENV === 'production';
  
  const io = new SocketIOServer(httpServer, {
    path: '/api/socket',
    cors: {
      origin: isProduction ? false : '*',
      methods: ['GET', 'POST', 'OPTIONS'],
    },
    transports: ['polling', 'websocket'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    serveClient: false,
    allowUpgrades: true,
  });
  
  console.log('Socket.IO: Server initialized on /api/socket path');
  
  // Store Socket.IO instance for access in index.ts
  setSocketIO(io);

  const MAX_CONNECTIONS_PER_IP = 10;
  const connectionCounts = new Map<string, number>();

  io.on('connection', (socket) => {
    const clientIp = socket.handshake.address || 'unknown';
    const currentCount = connectionCounts.get(clientIp) || 0;
    
    if (currentCount >= MAX_CONNECTIONS_PER_IP) {
      console.log(`Socket.IO: Rejected connection from ${clientIp} (limit reached)`);
      socket.emit('error', { message: 'Too many connections from your address' });
      socket.disconnect(true);
      return;
    }
    
    connectionCounts.set(clientIp, currentCount + 1);
    
    let tcpSocket: net.Socket | null = null;
    let connected = false;
    let gmcpEnabled = false;
    let gmcpNegotiated = false;
    let pendingBuffer = Buffer.alloc(0);

    console.log('Socket.IO: Client connected');

    function sendGmcpToMud(module: string, data: unknown) {
      if (!tcpSocket || !connected || !gmcpNegotiated) return;
      const jsonStr = data !== undefined ? ' ' + JSON.stringify(data) : '';
      const payload = module + jsonStr;
      const buf = Buffer.alloc(payload.length + 5);
      buf[0] = IAC;
      buf[1] = SB;
      buf[2] = GMCP;
      buf.write(payload, 3, 'utf8');
      buf[buf.length - 2] = IAC;
      buf[buf.length - 1] = SE;
      tcpSocket.write(buf);
    }

    function parseAndForwardData(buffer: Buffer) {
      pendingBuffer = Buffer.concat([pendingBuffer, buffer]);
      
      let textContent = '';
      let i = 0;
      
      while (i < pendingBuffer.length) {
        if (pendingBuffer[i] === IAC && i + 1 < pendingBuffer.length) {
          const cmd = pendingBuffer[i + 1];
          
          if (cmd === WILL || cmd === WONT || cmd === DO || cmd === DONT) {
            if (i + 2 >= pendingBuffer.length) break;
            
            const option = pendingBuffer[i + 2];
            
            if (option === GMCP) {
              if (cmd === WILL && gmcpEnabled) {
                tcpSocket?.write(Buffer.from([IAC, DO, GMCP]));
                gmcpNegotiated = true;
                console.log('Socket.IO: GMCP negotiated');
                sendGmcpToMud('Core.Hello', { client: 'Mudscape', version: '1.0' });
                sendGmcpToMud('Core.Supports.Set', ['Char 1', 'Char.Vitals 1', 'Room 1', 'Room.Info 1']);
              } else if (cmd === DO && gmcpEnabled) {
                tcpSocket?.write(Buffer.from([IAC, WILL, GMCP]));
              }
            }
            i += 3;
            continue;
          }
          
          if (cmd === SB) {
            let seIndex = -1;
            for (let j = i + 2; j < pendingBuffer.length - 1; j++) {
              if (pendingBuffer[j] === IAC && pendingBuffer[j + 1] === SE) {
                seIndex = j;
                break;
              }
            }
            
            if (seIndex === -1) break;
            
            const option = pendingBuffer[i + 2];
            if (option === GMCP) {
              const gmcpData = pendingBuffer.subarray(i + 3, seIndex).toString('utf8');
              const spaceIndex = gmcpData.indexOf(' ');
              let module: string, jsonData: unknown;
              
              if (spaceIndex === -1) {
                module = gmcpData;
                jsonData = {};
              } else {
                module = gmcpData.substring(0, spaceIndex);
                try {
                  jsonData = JSON.parse(gmcpData.substring(spaceIndex + 1));
                } catch {
                  jsonData = gmcpData.substring(spaceIndex + 1);
                }
              }
              
              socket.emit('gmcp', { module, data: jsonData });
            }
            
            i = seIndex + 2;
            continue;
          }
          
          if (cmd === IAC) {
            textContent += String.fromCharCode(IAC);
            i += 2;
            continue;
          }
          
          i += 2;
          continue;
        }
        
        textContent += String.fromCharCode(pendingBuffer[i]);
        i++;
      }
      
      pendingBuffer = pendingBuffer.subarray(i);
      
      if (textContent.length > 0) {
        socket.emit('data', { content: textContent });
      }
    }

    socket.on('mud:connect', (data: { host: string; port: number; encoding?: string; gmcp?: boolean }) => {
      try {
        if (!data.host || !data.port) {
          socket.emit('error', { message: 'Host and port are required' });
          return;
        }
        
        const port = Number(data.port);
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
          socket.emit('error', { message: 'Invalid port number' });
          return;
        }

        const host = String(data.host).trim();
        if (host.length > 255 || !/^[a-zA-Z0-9._-]+$/.test(host)) {
          socket.emit('error', { message: 'Invalid hostname' });
          return;
        }

        const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
        const isPrivateIP = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(host);
        if (blockedHosts.includes(host.toLowerCase()) || isPrivateIP) {
          socket.emit('error', { message: 'Connections to local/private addresses are not allowed' });
          return;
        }

        if (tcpSocket) {
          tcpSocket.destroy();
          tcpSocket = null;
        }

        gmcpEnabled = data.gmcp ?? true;
        gmcpNegotiated = false;
        pendingBuffer = Buffer.alloc(0);

        console.log(`Socket.IO: Connecting to ${host}:${port} (GMCP: ${gmcpEnabled})`);
        
        tcpSocket = new net.Socket();
        tcpSocket.connect(port, host, () => {
          connected = true;
          console.log('Socket.IO: TCP Connected');
          socket.emit('connected', { host: data.host, port: data.port });
          
          if (gmcpEnabled) {
            tcpSocket?.write(Buffer.from([IAC, WILL, GMCP]));
            console.log('Socket.IO: Sent IAC WILL GMCP');
          }
        });

        tcpSocket.on('data', (buffer) => {
          parseAndForwardData(buffer);
        });

        tcpSocket.on('close', () => {
          console.log('Socket.IO: TCP Closed');
          if (connected) {
            socket.emit('disconnected');
          }
          connected = false;
          tcpSocket = null;
        });

        tcpSocket.on('error', (err) => {
          console.error('Socket.IO: TCP Error', err);
          socket.emit('error', { message: err.message });
        });
      } catch (e) {
        console.error('Socket.IO: Connect error', e);
      }
    });

    socket.on('mud:disconnect', () => {
      if (tcpSocket) {
        tcpSocket.destroy();
        tcpSocket = null;
      }
      socket.emit('disconnected');
    });

    socket.on('mud:send', (data: { data: string }) => {
      if (tcpSocket && connected) {
        tcpSocket.write(data.data + '\r\n');
      }
    });

    socket.on('mud:gmcp', (data: { module: string; data: unknown }) => {
      sendGmcpToMud(data.module, data.data);
    });

    socket.on('disconnect', () => {
      console.log('Socket.IO: Client disconnected');
      if (tcpSocket) {
        tcpSocket.destroy();
      }
      const count = connectionCounts.get(clientIp) || 1;
      if (count <= 1) {
        connectionCounts.delete(clientIp);
      } else {
        connectionCounts.set(clientIp, count - 1);
      }
    });
  });

  return httpServer;
}

// Seed function
async function seedData() {
  const existing = await storage.getProfiles();
  if (existing.length === 0) {
    await storage.createProfile({
      name: 'Achaea',
      host: 'achaea.com',
      port: 23,
      encoding: 'ISO-8859-1',
      settings: { speechEnabled: true },
      triggers: [],
      aliases: [],
      scripts: []
    });
    await storage.createProfile({
      name: 'Aardwolf',
      host: 'aardmud.org',
      port: 4000,
      encoding: 'ISO-8859-1',
      settings: { speechEnabled: false },
      triggers: [],
      aliases: [],
      scripts: []
    });
  }
}

// Run seed
setTimeout(seedData, 1000);
