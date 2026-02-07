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
  fireTrigger?: (name: string, line?: string) => void;
  
  // User-friendly helpers
  notify?: (message: string, type?: 'info' | 'success' | 'warning' | 'danger') => void;
  setGauge?: (name: string, current: number, max: number, color?: string) => void;
  clearGauge?: (name: string) => void;
  log?: (message: string) => void;
  getLog?: () => string[];
  clearLog?: () => void;
  
  // Prompt detection
  onPrompt?: (callback: () => void) => void;
  isPrompt?: boolean;

  // Package management
  installPackage?: (url: string) => void;
}

let luaEngine: LuaEngine | null = null;
let luaFactory: LuaFactory | null = null;
let scriptContext: LuaScriptContext | null = null;
let initPromise: Promise<void> | null = null;

// Internal state for helper functions
const cooldowns: Map<string, number> = new Map();
const stopwatches: Map<string, number> = new Map();
const sessionLog: string[] = [];
const commandQueue: { commands: string[], delay: number, index: number, timerId?: ReturnType<typeof setTimeout> }[] = [];

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
  
  // Fire a trigger by name (for trigger chaining)
  luaEngine.global.set('fireTrigger', (name: string, line?: string) => {
    scriptContext?.fireTrigger?.(name, line);
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
  
  // ========== USER-FRIENDLY HELPER FUNCTIONS ==========
  
  // Notifications - show toast messages
  luaEngine.global.set('notify', (message: string, type?: string) => {
    scriptContext?.notify?.(message, (type as 'info' | 'success' | 'warning' | 'danger') ?? 'info');
  });

  luaEngine.global.set('installPackage', (url: string) => {
    scriptContext?.installPackage?.(url);
  });
  
  // Cooldowns - prevent command spam
  luaEngine.global.set('cooldown', (name: string, seconds: number) => {
    const now = Date.now();
    const lastUsed = cooldowns.get(name) || 0;
    const elapsed = (now - lastUsed) / 1000;
    
    if (elapsed >= seconds) {
      cooldowns.set(name, now);
      return true;
    }
    return false;
  });
  
  // Gauges - visual meters
  luaEngine.global.set('setGauge', (name: string, current: number, max: number, color?: string) => {
    scriptContext?.setGauge?.(name, current, max, color);
  });
  
  luaEngine.global.set('clearGauge', (name: string) => {
    scriptContext?.clearGauge?.(name);
  });
  
  // Command queue - send multiple commands with delays
  luaEngine.global.set('queue', (...args: string[]) => {
    const commands = args;
    const delay = 0.5; // 500ms between commands
    
    if (commands.length === 0) return;
    
    let index = 0;
    const sendNext = () => {
      if (index < commands.length) {
        scriptContext?.send(commands[index]);
        index++;
        if (index < commands.length) {
          setTimeout(sendNext, delay * 1000);
        }
      }
    };
    sendNext();
  });
  
  // Speedwalk - automatic movement
  luaEngine.global.set('speedwalk', (path: string) => {
    const directions: Record<string, string> = {
      'n': 'north', 's': 'south', 'e': 'east', 'w': 'west',
      'u': 'up', 'd': 'down', 'ne': 'northeast', 'nw': 'northwest',
      'se': 'southeast', 'sw': 'southwest'
    };
    
    const commands: string[] = [];
    // Parse path like "3n 2e s" or "3n2e1s"
    const pattern = /(\d*)([nsewud]|ne|nw|se|sw)/gi;
    let match;
    
    while ((match = pattern.exec(path)) !== null) {
      const count = parseInt(match[1]) || 1;
      const dir = match[2].toLowerCase();
      const fullDir = directions[dir] || dir;
      
      for (let i = 0; i < count; i++) {
        commands.push(fullDir);
      }
    }
    
    // Send with delay between each
    let index = 0;
    const sendNext = () => {
      if (index < commands.length) {
        scriptContext?.send(commands[index]);
        index++;
        if (index < commands.length) {
          setTimeout(sendNext, 250); // 250ms between moves
        }
      }
    };
    if (commands.length > 0) sendNext();
  });
  
  // Session log/journal
  luaEngine.global.set('log', (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    sessionLog.push(`[${timestamp}] ${message}`);
    scriptContext?.log?.(message);
  });
  
  luaEngine.global.set('getLog', () => {
    return scriptContext?.getLog?.() ?? [...sessionLog];
  });
  
  luaEngine.global.set('clearLog', () => {
    sessionLog.length = 0;
    scriptContext?.clearLog?.();
  });
  
  luaEngine.global.set('showLog', () => {
    const entries = scriptContext?.getLog?.() ?? sessionLog;
    if (entries.length === 0) {
      scriptContext?.echo('Session log is empty.');
    } else {
      scriptContext?.echo('--- Session Log ---');
      entries.forEach(entry => scriptContext?.echo(entry));
      scriptContext?.echo('--- End of Log ---');
    }
  });
  
  // Prompt detection - check if current line is a prompt
  luaEngine.global.set('isPrompt', () => {
    return scriptContext?.isPrompt ?? false;
  });
  
  // Stopwatch/Timer functions
  luaEngine.global.set('startStopwatch', (name: string) => {
    stopwatches.set(name, Date.now());
  });
  
  luaEngine.global.set('getElapsed', (name: string) => {
    const startTime = stopwatches.get(name);
    if (!startTime) return 0;
    return (Date.now() - startTime) / 1000;
  });
  
  luaEngine.global.set('stopStopwatch', (name: string) => {
    const elapsed = stopwatches.get(name);
    stopwatches.delete(name);
    if (!elapsed) return 0;
    return (Date.now() - elapsed) / 1000;
  });
  
  // String helper functions
  luaEngine.global.set('extractNumber', (text: string) => {
    const match = text?.match?.(/-?\d+(?:\.\d+)?/);
    return match ? parseFloat(match[0]) : null;
  });
  
  luaEngine.global.set('extractNumbers', (text: string) => {
    const matches = text?.match?.(/-?\d+(?:\.\d+)?/g);
    if (!matches) return [];
    const result: Record<number, number> = {};
    matches.forEach((m, i) => { result[i] = parseFloat(m); });
    return result;
  });
  
  luaEngine.global.set('contains', (text: string, search: string) => {
    return text?.includes?.(search) ?? false;
  });
  
  luaEngine.global.set('startsWith', (text: string, prefix: string) => {
    return text?.startsWith?.(prefix) ?? false;
  });
  
  luaEngine.global.set('endsWith', (text: string, suffix: string) => {
    return text?.endsWith?.(suffix) ?? false;
  });
  
  luaEngine.global.set('split', (text: string, delimiter: string) => {
    const parts = text?.split?.(delimiter) ?? [];
    const result: Record<number, string> = {};
    parts.forEach((p, i) => { result[i] = p; });
    return result;
  });
  
  luaEngine.global.set('trim', (text: string) => {
    return text?.trim?.() ?? '';
  });
  
  luaEngine.global.set('lower', (text: string) => {
    return text?.toLowerCase?.() ?? '';
  });
  
  luaEngine.global.set('upper', (text: string) => {
    return text?.toUpperCase?.() ?? '';
  });
}

export function updateScriptLocals(line?: string, matches?: string[], namedCaptures?: Record<string, string>): void {
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
  
  // Named captures (from regex named groups like (?<name>...))
  if (namedCaptures && Object.keys(namedCaptures).length > 0) {
    luaEngine.global.set('captures', namedCaptures);
  } else {
    luaEngine.global.set('captures', {});
  }
}

export async function executeLuaScript(
  script: string,
  line?: string,
  matches?: string[],
  namedCaptures?: Record<string, string>
): Promise<unknown> {
  if (!luaEngine) {
    await initLuaEngine();
  }
  
  if (!luaEngine) {
    throw new Error('Lua engine not initialized');
  }
  
  updateScriptLocals(line, matches, namedCaptures);
  
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

-- USER-FRIENDLY HELPERS:
--   notify(message, type)      - Show a notification (info/success/warning/danger)
--   cooldown(name, seconds)    - Returns true if enough time passed, prevents spam
--   setGauge(name, current, max, color) - Create/update a visual meter
--   clearGauge(name)           - Remove a gauge
--   queue(cmd1, cmd2, ...)     - Send commands with delays between them
--   speedwalk(path)            - Auto-walk a path like "3n2e1s"
--   log(message)               - Add to session journal
--   showLog()                  - Display the session log
--   clearLog()                 - Clear the session log

-- STOPWATCH/TIMING:
--   startStopwatch(name)       - Start a timer
--   getElapsed(name)           - Get seconds since start
--   stopStopwatch(name)        - Stop and return elapsed time

-- STRING HELPERS:
--   extractNumber(text)        - Get first number from text
--   extractNumbers(text)       - Get all numbers as a table
--   contains(text, search)     - Check if text contains search
--   startsWith(text, prefix)   - Check if text starts with prefix
--   endsWith(text, suffix)     - Check if text ends with suffix
--   split(text, delimiter)     - Split text into a table
--   trim(text)                 - Remove leading/trailing whitespace
--   lower(text)                - Convert to lowercase
--   upper(text)                - Convert to uppercase

-- UTILITY:
--   expandAlias(command)       - Run command through alias processing
--   wait(seconds, callback)    - Execute code after delay
--   fireTrigger(name, line)    - Execute another trigger by name (for chaining)
--   isPrompt()                 - Check if current line matches prompt pattern

-- AVAILABLE VARIABLES (in triggers):
--   line     - The line that triggered the pattern
--   matches  - Table of captured groups (matches[0] = full match)
--   captures - Named capture groups (e.g., captures.target from (?<target>\\w+))

-- EXAMPLES:

-- Simple trigger script:
--   send("attack " .. matches[1])

-- Using named captures (pattern: "(?<enemy>\\w+) attacks you"):
--   echo("Attacked by: " .. captures.enemy)

-- Prevent spam with cooldown:
--   if cooldown("heal", 5) then
--     send("cast heal")
--   else
--     echo("Heal is on cooldown!")
--   end

-- Show notification:
--   notify("Low health!", "danger")

-- Create a health bar:
--   setGauge("health", 75, 100, "red")

-- Send combo with delays:
--   queue("kick", "punch", "uppercut")

-- Speedwalk to a location:
--   speedwalk("3n 2e s")

-- Extract numbers from text:
--   local hp = extractNumber(line)

-- Time a boss fight:
--   startStopwatch("boss")
--   -- later...
--   echo("Fight took " .. getElapsed("boss") .. " seconds")

-- Keep a session journal:
--   log("Killed the dragon!")
--   showLog()

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
