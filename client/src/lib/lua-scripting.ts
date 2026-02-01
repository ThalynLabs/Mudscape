import { LuaFactory, LuaEngine } from 'wasmoon';

export interface LuaScriptContext {
  send: (command: string) => void;
  echo: (text: string) => void;
  setVariable: (name: string, value: string | number | boolean | null) => void;
  getVariable: (name: string) => string | number | boolean | null | undefined;
  playSound: (name: string, volume?: number, loop?: boolean) => void;
  stopSound: (name: string) => void;
  loopSound: (name: string, volume?: number) => void;
  setSoundPosition: (name: string, x: number, y: number, z?: number) => void;
  line?: string;
  matches?: string[];
}

let luaEngine: LuaEngine | null = null;
let luaFactory: LuaFactory | null = null;
let scriptContext: LuaScriptContext | null = null;
let initPromise: Promise<void> | null = null;

export async function initLuaEngine(): Promise<void> {
  if (luaEngine) return;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    luaFactory = new LuaFactory();
    luaEngine = await luaFactory.createEngine();
    console.log('Lua engine initialized');
  })();
  
  return initPromise;
}

export function isLuaReady(): boolean {
  return luaEngine !== null;
}

export function setScriptContext(context: LuaScriptContext): void {
  scriptContext = context;
  
  if (!luaEngine) return;
  
  luaEngine.global.set('send', (cmd: string) => {
    scriptContext?.send(cmd);
  });
  
  luaEngine.global.set('echo', (text: string) => {
    scriptContext?.echo(text);
  });
  
  luaEngine.global.set('setVariable', (name: string, value: string | number | boolean | null) => {
    scriptContext?.setVariable(name, value);
  });
  
  luaEngine.global.set('getVariable', (name: string) => {
    return scriptContext?.getVariable(name);
  });
  
  luaEngine.global.set('playSound', (name: string, volume?: number, loop?: boolean) => {
    scriptContext?.playSound(name, volume, loop);
  });
  
  luaEngine.global.set('stopSound', (name: string) => {
    scriptContext?.stopSound(name);
  });
  
  luaEngine.global.set('loopSound', (name: string, volume?: number) => {
    scriptContext?.loopSound(name, volume);
  });
  
  luaEngine.global.set('setSoundPosition', (name: string, x: number, y: number, z?: number) => {
    scriptContext?.setSoundPosition(name, x, y, z ?? 0);
  });
}

export function updateScriptLocals(line?: string, matches?: string[]): void {
  if (!luaEngine) return;
  
  luaEngine.global.set('line', line ?? '');
  
  if (matches) {
    const matchTable: Record<number, string> = {};
    matches.forEach((m, i) => {
      matchTable[i] = m;
    });
    luaEngine.global.set('matches', matchTable);
  } else {
    luaEngine.global.set('matches', {});
  }
}

export async function executeLuaScript(
  script: string,
  line?: string,
  matches?: string[]
): Promise<unknown> {
  if (!luaEngine) {
    await initLuaEngine();
  }
  
  if (!luaEngine) {
    throw new Error('Lua engine not initialized');
  }
  
  updateScriptLocals(line, matches);
  
  try {
    const result = await luaEngine.doString(script);
    return result;
  } catch (error) {
    console.error('Lua script error:', error);
    throw error;
  }
}

export function destroyLuaEngine(): void {
  if (luaEngine) {
    luaEngine.global.close();
    luaEngine = null;
  }
  luaFactory = null;
  scriptContext = null;
}

export const LUA_SCRIPTING_HELP = `
-- Lua Scripting Reference for Mudscape
-- =====================================

-- Available Functions:
--   send(command)              - Send a command to the MUD
--   echo(text)                 - Display text locally (not sent to MUD)
--   setVariable(name, value)   - Store a variable (persisted)
--   getVariable(name)          - Retrieve a stored variable

-- Sound Functions:
--   playSound(name, volume, loop) - Play a sound from soundpack
--   stopSound(name)               - Stop a playing sound
--   loopSound(name, volume)       - Start a looping sound
--   setSoundPosition(name, x, y, z) - Set 3D position for directional audio

-- Available Variables (in triggers):
--   line     - The line that triggered the pattern
--   matches  - Table of captured groups (matches[0] = full match)

-- Examples:
-- Simple trigger script:
--   send("attack " .. matches[1])

-- Using variables:
--   local hp = getVariable("hp") or 100
--   if hp < 50 then
--     send("heal self")
--   end

-- Playing sounds:
--   playSound("sword_hit", 0.8)
--   loopSound("ambient_forest", 0.3)

-- Directional sound (left/right):
--   setSoundPosition("footsteps", -1, 0)  -- sound from left
--   setSoundPosition("monster", 1, 0)     -- sound from right
`;
