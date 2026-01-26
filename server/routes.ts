import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import * as net from "net";

// Type for incoming WebSocket messages
type WsClientMessage = 
  | { type: 'connect'; host: string; port: number; encoding?: string }
  | { type: 'disconnect' }
  | { type: 'send'; data: string };

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // === PROFILE ROUTES ===
  app.get(api.profiles.list.path, async (req, res) => {
    const profiles = await storage.getProfiles();
    res.json(profiles);
  });

  app.get(api.profiles.get.path, async (req, res) => {
    const profile = await storage.getProfile(Number(req.params.id));
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json(profile);
  });

  app.post(api.profiles.create.path, async (req, res) => {
    try {
      const input = api.profiles.create.input.parse(req.body);
      const profile = await storage.createProfile(input);
      res.status(201).json(profile);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      throw e;
    }
  });

  app.put(api.profiles.update.path, async (req, res) => {
    try {
      const input = api.profiles.update.input.parse(req.body);
      const profile = await storage.updateProfile(Number(req.params.id), input);
      if (!profile) return res.status(404).json({ message: "Profile not found" });
      res.json(profile);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      throw e;
    }
  });

  app.delete(api.profiles.delete.path, async (req, res) => {
    await storage.deleteProfile(Number(req.params.id));
    res.status(204).send();
  });

  // === WEBSOCKET RELAY ===
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    if (request.url?.startsWith('/ws')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws) => {
    let tcpSocket: net.Socket | null = null;
    let connected = false;

    console.log('WS: Client connected');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString()) as WsClientMessage;
        
        if (data.type === 'connect') {
          if (tcpSocket) {
            tcpSocket.destroy();
            tcpSocket = null;
          }

          console.log(`WS: Connecting to ${data.host}:${data.port}`);
          
          tcpSocket = new net.Socket();
          tcpSocket.connect(data.port, data.host, () => {
            connected = true;
            console.log('WS: TCP Connected');
            ws.send(JSON.stringify({ 
              type: 'connected', 
              host: data.host, 
              port: data.port 
            }));
          });

          tcpSocket.on('data', (buffer) => {
            // We send raw strings (ISO-8859-1 or UTF-8 mixed)
            // For now, simple toString. A robust MUD client needs explicit encoding handling.
            // But browsers deal well with UTF-8. 
            // Ideally we'd use iconv-lite here if the MUD uses Latin-1.
            // Let's assume Latin-1 (ISO-8859-1) is common for MUDs and use 'latin1' encoding for toString
            // if we are unsure, or just pass it as is. 
            // Wait, Node's buffer.toString('utf8') might garble Latin1.
            // buffer.toString('latin1') is safer for old MUDs.
            // But modern MUDs use UTF-8.
            // Let's try to detect or just default to utf-8, but maybe add a setting later.
            // For now, let's use utf-8 as default for the MVP.
            
            const content = buffer.toString('utf8');
            ws.send(JSON.stringify({ type: 'data', content }));
          });

          tcpSocket.on('close', () => {
            console.log('WS: TCP Closed');
            if (connected) {
              ws.send(JSON.stringify({ type: 'disconnected' }));
            }
            connected = false;
            tcpSocket = null;
          });

          tcpSocket.on('error', (err) => {
            console.error('WS: TCP Error', err);
            ws.send(JSON.stringify({ type: 'error', message: err.message }));
          });

        } else if (data.type === 'disconnect') {
          if (tcpSocket) {
            tcpSocket.destroy();
            tcpSocket = null;
          }
          ws.send(JSON.stringify({ type: 'disconnected' }));

        } else if (data.type === 'send') {
          if (tcpSocket && connected) {
            // MUDs expect \r\n
            tcpSocket.write(data.data + '\r\n');
          }
        }
      } catch (e) {
        console.error('WS: Message error', e);
      }
    });

    ws.on('close', () => {
      if (tcpSocket) {
        tcpSocket.destroy();
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
