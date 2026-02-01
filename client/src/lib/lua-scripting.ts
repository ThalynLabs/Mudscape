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
  
  // Extended API for MUD client compatibility
  gag?: () => void;
  highlight?: (pattern: string, fgColor: string, bgColor?: string) => void;
  replace?: (oldText: string, newText: string) => void;
  
  // Dynamic automation
  tempTrigger?: (pattern: string, script: string, timeout?: number) => string;
  tempAlias?: (pattern: string, script: string) => string;
  tempTimer?: (seconds: number, script: string) => string;
  killTrigger?: (id: string) => void;
  killAlias?: (id: string) => void;
  killTimer?: (id: string) => void;
  
  // Toggle functions
  enableTrigger?: (name: string) => void;
  disableTrigger?: (name: string) => void;
  enableAlias?: (name: string) => void;
  disableAlias?: (name: string) => void;
  enableTimer?: (name: string) => void;
  disableTimer?: (name: string) => void;
  enableClass?: (name: string) => void;
  disableClass?: (name: string) => void;
  
  // Utility
  expandAlias?: (command: string) => string;
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
  
  // Core functions
  luaEngine.global.set('send', (cmd: string) => {
    scriptContext?.send(cmd);
  });
  
  luaEngine.global.set('echo', (text: string) => {
    scriptContext?.echo(text);
  });
  
  luaEngine.global.set('print', (text: string) => {
    scriptContext?.echo(`[debug] ${text}`);
  });
  
  luaEngine.global.set('setVariable', (name: string, value: string | number | boolean | null) => {
    scriptContext?.setVariable(name, value);
  });
  
  luaEngine.global.set('getVariable', (name: string) => {
    return scriptContext?.getVariable(name);
  });
  
  // Sound functions
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
  
  // Text manipulation functions
  luaEngine.global.set('gag', () => {
    scriptContext?.gag?.();
  });
  
  luaEngine.global.set('highlight', (pattern: string, fgColor: string, bgColor?: string) => {
    scriptContext?.highlight?.(pattern, fgColor, bgColor);
  });
  
  luaEngine.global.set('replace', (oldText: string, newText: string) => {
    scriptContext?.replace?.(oldText, newText);
  });
  
  // Dynamic automation functions
  luaEngine.global.set('tempTrigger', (pattern: string, script: string, timeout?: number) => {
    return scriptContext?.tempTrigger?.(pattern, script, timeout) ?? '';
  });
  
  luaEngine.global.set('tempAlias', (pattern: string, script: string) => {
    return scriptContext?.tempAlias?.(pattern, script) ?? '';
  });
  
  luaEngine.global.set('tempTimer', (seconds: number, script: string) => {
    return scriptContext?.tempTimer?.(seconds, script) ?? '';
  });
  
  luaEngine.global.set('killTrigger', (id: string) => {
    scriptContext?.killTrigger?.(id);
  });
  
  luaEngine.global.set('killAlias', (id: string) => {
    scriptContext?.killAlias?.(id);
  });
  
  luaEngine.global.set('killTimer', (id: string) => {
    scriptContext?.killTimer?.(id);
  });
  
  // Toggle functions
  luaEngine.global.set('enableTrigger', (name: string) => {
    scriptContext?.enableTrigger?.(name);
  });
  
  luaEngine.global.set('disableTrigger', (name: string) => {
    scriptContext?.disableTrigger?.(name);
  });
  
  luaEngine.global.set('enableAlias', (name: string) => {
    scriptContext?.enableAlias?.(name);
  });
  
  luaEngine.global.set('disableAlias', (name: string) => {
    scriptContext?.disableAlias?.(name);
  });
  
  luaEngine.global.set('enableTimer', (name: string) => {
    scriptContext?.enableTimer?.(name);
  });
  
  luaEngine.global.set('disableTimer', (name: string) => {
    scriptContext?.disableTimer?.(name);
  });
  
  luaEngine.global.set('enableClass', (name: string) => {
    scriptContext?.enableClass?.(name);
  });
  
  luaEngine.global.set('disableClass', (name: string) => {
    scriptContext?.disableClass?.(name);
  });
  
  // Utility functions
  luaEngine.global.set('expandAlias', (command: string) => {
    return scriptContext?.expandAlias?.(command) ?? command;
  });
  
  // Wait function (using setTimeout under the hood)
  luaEngine.global.set('wait', (seconds: number, callback: () => void) => {
    setTimeout(() => {
      if (callback && typeof callback === 'function') {
        try {
          callback();
        } catch (err) {
          console.error('Wait callback error:', err);
        }
      }
    }, seconds * 1000);
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

-- CORE FUNCTIONS:
--   send(command)              - Send a command to the MUD
--   echo(text)                 - Display text locally (not sent to MUD)
--   print(text)                - Debug output (prefixed with [debug])
--   setVariable(name, value)   - Store a variable (persisted)
--   getVariable(name)          - Retrieve a stored variable

-- SOUND FUNCTIONS:
--   playSound(name, volume, loop) - Play a sound from soundpack
--   stopSound(name)               - Stop a playing sound
--   loopSound(name, volume)       - Start a looping sound
--   setSoundPosition(name, x, y, z) - Set 3D position for directional audio

-- TEXT MANIPULATION (trigger scripts only):
--   gag()                      - Hide the current line from display
--   replace(old, new)          - Replace text in the current line

-- DYNAMIC AUTOMATION:
--   tempTrigger(pattern, script, timeout) - Create a one-time trigger
--   tempAlias(pattern, script)            - Create a temporary alias
--   tempTimer(seconds, script)            - Create a one-shot timer
--   killTrigger(id)                       - Remove a temporary trigger
--   killAlias(id)                         - Remove a temporary alias
--   killTimer(id)                         - Remove a temporary timer

-- TOGGLE FUNCTIONS:
--   enableTrigger(name)        - Enable a trigger by name
--   disableTrigger(name)       - Disable a trigger by name
--   enableAlias(name)          - Enable an alias by name
--   disableAlias(name)         - Disable an alias by name
--   enableTimer(name)          - Enable a timer by name
--   disableTimer(name)         - Disable a timer by name
--   enableClass(name)          - Enable all items in a class
--   disableClass(name)         - Disable all items in a class

-- UTILITY:
--   expandAlias(command)       - Run command through alias processing
--   wait(seconds, callback)    - Execute code after delay

-- AVAILABLE VARIABLES (in triggers):
--   line     - The line that triggered the pattern
--   matches  - Table of captured groups (matches[0] = full match)

-- EXAMPLES:

-- Simple trigger script:
--   send("attack " .. matches[1])

-- Using variables:
--   local hp = getVariable("hp") or 100
--   if hp < 50 then
--     send("heal self")
--   end

-- Gag a line (hide it):
--   gag()

-- Replace text in line:
--   replace("gold coins", "GOLD!")

-- Create a one-time trigger:
--   tempTrigger("You fall asleep", 'send("wake")', 60)

-- Toggle automation:
--   disableTrigger("spam_trigger")
--   enableClass("combat")

-- Delayed execution:
--   wait(2, function()
--     send("look")
--   end)

-- Playing sounds:
--   playSound("sword_hit", 0.8)
--   loopSound("ambient_forest", 0.3)

-- Directional sound (left/right):
--   setSoundPosition("footsteps", -1, 0)  -- sound from left
--   setSoundPosition("monster", 1, 0)     -- sound from right
`;
