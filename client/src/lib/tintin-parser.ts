import { MudTrigger, MudAlias, MudTimer, MudClass, PackageContents } from "@shared/schema";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function escapeLuaString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function buildLuaSendCommand(cmd: string, wildcardReplacer: (num: number) => string): string {
  const parts: string[] = [];
  let lastIndex = 0;
  const regex = /%(\d)/g;
  let match;
  
  while ((match = regex.exec(cmd)) !== null) {
    if (match.index > lastIndex) {
      const textPart = cmd.slice(lastIndex, match.index);
      parts.push(`"${escapeLuaString(textPart)}"`);
    }
    parts.push(wildcardReplacer(parseInt(match[1])));
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < cmd.length) {
    parts.push(`"${escapeLuaString(cmd.slice(lastIndex))}"`);
  }
  
  if (parts.length === 0) {
    return 'send("")';
  }
  
  return `send(${parts.join(' .. ')})`;
}

const SOUND_EXTENSIONS = new Set(['.wav', '.mp3', '.ogg', '.flac', '.m4a', '.aac', '.mid', '.midi']);

function isSoundPlayCommand(cmd: string): { soundName: string } | null {
  const trimmed = cmd.trim();
  const systemMatch = trimmed.match(/^#system\s*\{(.+)\}\s*$/i) || trimmed.match(/^#system\s+(.+)$/i);
  if (!systemMatch) return null;

  const systemCmd = systemMatch[1].trim();
  const playerMatch = systemCmd.match(/^(?:aplay|play|paplay|mpv|mplayer|vlc|ffplay|sox|afplay|cvlc|powershell.*?SoundPlayer)\s+(.+)/i);
  if (!playerMatch) return null;

  let filePath = playerMatch[1].trim().replace(/^["']|["']$/g, '').replace(/\s*[&>|].*$/, '').trim();
  const fileName = filePath.replace(/\\/g, '/').split('/').pop() || filePath;
  const ext = '.' + (fileName.split('.').pop() || '').toLowerCase();
  if (!SOUND_EXTENSIONS.has(ext)) return null;

  const soundName = fileName.replace(/\.[^.]+$/, '');
  return { soundName };
}

function convertCommandToLua(cmd: string, wildcardReplacer: (num: number) => string): string {
  const soundInfo = isSoundPlayCommand(cmd);
  if (soundInfo) {
    return `playSound("${escapeLuaString(soundInfo.soundName)}")`;
  }
  return buildLuaSendCommand(cmd, wildcardReplacer);
}

interface ParseContext {
  classes: MudClass[];
  classPathMap: Map<string, string>;
  referencedSounds: Set<string>;
}

function getOrCreateClass(name: string, context: ParseContext): string {
  const existingId = context.classPathMap.get(name);
  if (existingId) return existingId;
  
  const newClass: MudClass = {
    id: generateId(),
    name,
    active: true,
  };
  context.classes.push(newClass);
  context.classPathMap.set(name, newClass.id);
  return newClass.id;
}

function extractBraces(line: string, startIndex: number): { content: string; endIndex: number } | null {
  if (line[startIndex] !== '{') return null;
  
  let depth = 0;
  let start = startIndex;
  
  for (let i = startIndex; i < line.length; i++) {
    if (line[i] === '{') depth++;
    else if (line[i] === '}') {
      depth--;
      if (depth === 0) {
        return {
          content: line.substring(start + 1, i),
          endIndex: i
        };
      }
    }
  }
  return null;
}

function collectSoundsFromCommands(commands: string[], context: ParseContext) {
  for (const cmd of commands) {
    const soundInfo = isSoundPlayCommand(cmd);
    if (soundInfo) {
      context.referencedSounds.add(soundInfo.soundName);
    }
  }
}

function parseTinTinLine(line: string, context: ParseContext): {
  triggers: MudTrigger[];
  aliases: MudAlias[];
  timers: MudTimer[];
} {
  const triggers: MudTrigger[] = [];
  const aliases: MudAlias[] = [];
  const timers: MudTimer[] = [];
  
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
    return { triggers, aliases, timers };
  }
  
  const actionMatch = trimmed.match(/^#action\s+/i);
  if (actionMatch) {
    const afterCommand = trimmed.substring(actionMatch[0].length);
    const pattern = extractBraces(afterCommand, 0);
    if (pattern) {
      const afterPattern = afterCommand.substring(pattern.endIndex + 1).trim();
      const command = extractBraces(afterPattern, 0);
      if (command) {
        const convertedPattern = pattern.content
          .replace(/%(\d)/g, '(.+)')
          .replace(/\*/g, '.*');
        
        const hasVariables = /%\d/.test(command.content);
        const commands = command.content.split(';').filter(c => c.trim());
        collectSoundsFromCommands(commands, context);
        
        const hasSounds = commands.some(c => isSoundPlayCommand(c));
        
        let script: string;
        if (hasVariables || hasSounds) {
          const luaCommands = commands.map(cmd => 
            convertCommandToLua(cmd.trim(), (num) => {
              if (num === 0) return '(line or "")';
              return `(matches[${num}] or "")`;
            })
          );
          script = `-- Converted from TinTin++\n-- Original: ${escapeLuaString(command.content)}\n${luaCommands.join('\n')}`;
        } else {
          script = `-- Converted from TinTin++\n${commands.map(c => `send("${escapeLuaString(c.trim())}")`).join('\n')}`;
        }
        
        triggers.push({
          id: generateId(),
          pattern: convertedPattern,
          type: 'regex',
          script,
          active: true,
          classId: undefined,
        });
      }
    }
    return { triggers, aliases, timers };
  }
  
  const aliasMatch = trimmed.match(/^#alias\s+/i);
  if (aliasMatch) {
    const afterCommand = trimmed.substring(aliasMatch[0].length);
    const name = extractBraces(afterCommand, 0);
    if (name) {
      const afterName = afterCommand.substring(name.endIndex + 1).trim();
      const command = extractBraces(afterName, 0);
      if (command) {
        const convertedPattern = `^${name.content}(?:\\s+(.*))?$`;
        
        const hasVariables = /%\d/.test(command.content);
        const commands = command.content.split(';').filter(c => c.trim());
        collectSoundsFromCommands(commands, context);
        
        const hasSounds = commands.some(c => isSoundPlayCommand(c));
        
        let commandValue: string;
        if (hasVariables || hasSounds) {
          const luaCommands = commands.map(cmd => 
            convertCommandToLua(cmd.trim(), (num) => {
              if (num === 0) return '(matches[1] or "")';
              return `(matches[${num + 1}] or "")`;
            })
          );
          commandValue = `-- Converted from TinTin++\n-- Original: ${escapeLuaString(command.content)}\n${luaCommands.join('\n')}`;
        } else {
          commandValue = commands.map(c => c.trim()).join('\n');
        }
        
        aliases.push({
          id: generateId(),
          pattern: convertedPattern,
          command: commandValue,
          isScript: hasVariables || hasSounds,
          active: true,
          classId: undefined,
        });
      }
    }
    return { triggers, aliases, timers };
  }
  
  const tickerMatch = trimmed.match(/^#ticker\s+/i);
  if (tickerMatch) {
    const afterCommand = trimmed.substring(tickerMatch[0].length);
    const name = extractBraces(afterCommand, 0);
    if (name) {
      const afterName = afterCommand.substring(name.endIndex + 1).trim();
      const command = extractBraces(afterName, 0);
      if (command) {
        const afterCmd = afterName.substring(command.endIndex + 1).trim();
        const interval = extractBraces(afterCmd, 0);
        const intervalSeconds = interval ? parseInt(interval.content) : 60;
        
        const timerCommands = command.content.split(';').filter(c => c.trim());
        collectSoundsFromCommands(timerCommands, context);
        
        const timerScript = `-- Converted from TinTin++\n${timerCommands.map(c => {
          const soundInfo = isSoundPlayCommand(c.trim());
          if (soundInfo) return `playSound("${escapeLuaString(soundInfo.soundName)}")`;
          return `send("${escapeLuaString(c.trim())}")`;
        }).join('\n')}`;
        
        timers.push({
          id: generateId(),
          name: name.content,
          interval: intervalSeconds * 1000,
          script: timerScript,
          oneShot: false,
          active: true,
          classId: undefined,
        });
      }
    }
    return { triggers, aliases, timers };
  }
  
  return { triggers, aliases, timers };
}

export interface TinTinParseResult {
  contents: PackageContents;
  referencedSounds: string[];
}

export function parseTinTinConfig(content: string): PackageContents {
  const result = parseTinTinConfigWithSounds(content);
  return result.contents;
}

export function parseTinTinConfigWithSounds(content: string): TinTinParseResult {
  const context: ParseContext = {
    classes: [],
    classPathMap: new Map(),
    referencedSounds: new Set(),
  };
  
  const contents: PackageContents = {
    triggers: [],
    aliases: [],
    timers: [],
    keybindings: [],
    buttons: [],
    classes: [],
  };
  
  const lines = content.split('\n');
  
  for (const line of lines) {
    const result = parseTinTinLine(line, context);
    contents.triggers!.push(...result.triggers);
    contents.aliases!.push(...result.aliases);
    contents.timers!.push(...result.timers);
  }
  
  contents.classes = context.classes;
  
  return {
    contents,
    referencedSounds: Array.from(context.referencedSounds),
  };
}

export function getTinTinImportSummary(contents: PackageContents, soundCount?: number): string {
  const parts: string[] = [];
  if (contents.triggers && contents.triggers.length) parts.push(`${contents.triggers.length} triggers`);
  if (contents.aliases && contents.aliases.length) parts.push(`${contents.aliases.length} aliases`);
  if (contents.timers && contents.timers.length) parts.push(`${contents.timers.length} timers`);
  if (contents.classes && contents.classes.length) parts.push(`${contents.classes.length} classes`);
  if (soundCount && soundCount > 0) parts.push(`${soundCount} sound files`);
  return parts.join(', ') || 'No items found';
}
