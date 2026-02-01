import { MudTrigger, MudAlias, MudTimer, MudClass, PackageContents } from "@shared/schema";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
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
        
        const convertedCommand = command.content
          .replace(/%(\d)/g, (_, num) => `matches[${parseInt(num) + 1}]`)
          .replace(/;/g, '\nsend("') + '")';
        
        const isLuaScript = command.content.includes('#') || 
                           command.content.includes('$') ||
                           command.content.includes('%');
        
        triggers.push({
          id: generateId(),
          pattern: convertedPattern,
          type: 'regex',
          script: isLuaScript 
            ? `-- Converted from TinTin++\n-- Original: ${command.content}\nlocal cmd = "${command.content}"\nsend(cmd)` 
            : `-- Converted from TinTin++\nsend("${command.content.replace(/;/g, '")\nsend("')}")`,
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
        
        const hasVariables = command.content.includes('%') || command.content.includes('$');
        
        aliases.push({
          id: generateId(),
          pattern: convertedPattern,
          command: hasVariables 
            ? `-- Converted from TinTin++\n-- Original: ${command.content}\nlocal args = matches[2] or ""\nsend("${command.content.replace(/%0/g, '" .. args .. "').replace(/;/g, '")\nsend("')}")`
            : command.content.replace(/;/g, '\n'),
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
        
        timers.push({
          id: generateId(),
          name: name.content,
          interval: intervalSeconds * 1000,
          script: `-- Converted from TinTin++\nsend("${command.content.replace(/;/g, '")\nsend("')}")`,
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
