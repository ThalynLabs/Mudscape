import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import * as net from "net";

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

  app.post(api.soundpacks.create.path, async (req, res) => {
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

  app.put(api.soundpacks.update.path, async (req, res) => {
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

  app.delete(api.soundpacks.delete.path, async (req, res) => {
    await storage.deleteSoundpack(Number(req.params.id));
    res.status(204).send();
  });

  // === GLOBAL SETTINGS ROUTES ===
  app.get(api.settings.get.path, async (req, res) => {
    const settings = await storage.getGlobalSettings();
    res.json(settings);
  });

  app.put(api.settings.update.path, async (req, res) => {
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
    let gmcpEnabled = false;
    let gmcpNegotiated = false;
    let pendingBuffer = Buffer.alloc(0);

    console.log('WS: Client connected');

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
                console.log('WS: GMCP negotiated');
                sendGmcpToMud('Core.Hello', { client: 'AccessibleMUD', version: '1.0' });
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
              
              ws.send(JSON.stringify({ type: 'gmcp', module, data: jsonData }));
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
        ws.send(JSON.stringify({ type: 'data', content: textContent }));
      }
    }

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString()) as WsClientMessage;
        
        if (data.type === 'connect') {
          if (tcpSocket) {
            tcpSocket.destroy();
            tcpSocket = null;
          }

          gmcpEnabled = data.gmcp ?? true;
          gmcpNegotiated = false;
          pendingBuffer = Buffer.alloc(0);

          console.log(`WS: Connecting to ${data.host}:${data.port} (GMCP: ${gmcpEnabled})`);
          
          tcpSocket = new net.Socket();
          tcpSocket.connect(data.port, data.host, () => {
            connected = true;
            console.log('WS: TCP Connected');
            ws.send(JSON.stringify({ 
              type: 'connected', 
              host: data.host, 
              port: data.port 
            }));
            
            if (gmcpEnabled) {
              tcpSocket?.write(Buffer.from([IAC, WILL, GMCP]));
              console.log('WS: Sent IAC WILL GMCP');
            }
          });

          tcpSocket.on('data', (buffer) => {
            parseAndForwardData(buffer);
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
            tcpSocket.write(data.data + '\r\n');
          }

        } else if (data.type === 'gmcp') {
          sendGmcpToMud(data.module, data.data);
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
