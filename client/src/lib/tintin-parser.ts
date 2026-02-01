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

interface ParseContext {
  classes: MudClass[];
  classPathMap: Map<string, string>;
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
        
        let script: string;
        if (hasVariables) {
          const luaCommands = commands.map(cmd => 
            buildLuaSendCommand(cmd.trim(), (num) => {
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
        
        let commandValue: string;
        if (hasVariables) {
          const luaCommands = commands.map(cmd => 
            buildLuaSendCommand(cmd.trim(), (num) => {
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
          isScript: hasVariables,
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
        const timerScript = `-- Converted from TinTin++\n${timerCommands.map(c => `send("${escapeLuaString(c.trim())}")`).join('\n')}`;
        
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

export function parseTinTinConfig(content: string): PackageContents {
  const context: ParseContext = {
    classes: [],
    classPathMap: new Map(),
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
  
  return contents;
}

export function getTinTinImportSummary(contents: PackageContents): string {
  const parts: string[] = [];
  if (contents.triggers && contents.triggers.length) parts.push(`${contents.triggers.length} triggers`);
  if (contents.aliases && contents.aliases.length) parts.push(`${contents.aliases.length} aliases`);
  if (contents.timers && contents.timers.length) parts.push(`${contents.timers.length} timers`);
  if (contents.classes && contents.classes.length) parts.push(`${contents.classes.length} classes`);
  return parts.join(', ') || 'No items found';
}
