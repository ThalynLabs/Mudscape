import { MudTrigger, MudAlias, MudKeybinding, MudClass, PackageContents } from "@shared/schema";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function escapeLuaString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function buildVipMudSendCommand(cmd: string): string {
  const parts: string[] = [];
  let lastIndex = 0;
  const regex = /@(\w+)/g;
  let match;
  
  while ((match = regex.exec(cmd)) !== null) {
    if (match.index > lastIndex) {
      const textPart = cmd.slice(lastIndex, match.index);
      parts.push(`"${escapeLuaString(textPart)}"`);
    }
    parts.push(`getVariable("${match[1]}")`);
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

function parseVipMudLine(line: string, context: ParseContext): {
  triggers: MudTrigger[];
  aliases: MudAlias[];
  keybindings: MudKeybinding[];
} {
  const triggers: MudTrigger[] = [];
  const aliases: MudAlias[] = [];
  const keybindings: MudKeybinding[] = [];
  
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith("'")) {
    return { triggers, aliases, keybindings };
  }
  
  const triggerMatch = trimmed.match(/^#TRIGGER\s+/i);
  if (triggerMatch) {
    const afterCommand = trimmed.substring(triggerMatch[0].length);
    const pattern = extractBraces(afterCommand, 0);
    if (pattern) {
      const afterPattern = afterCommand.substring(pattern.endIndex + 1).trim();
      const command = extractBraces(afterPattern, 0);
      if (command) {
        const convertedPattern = pattern.content
          .replace(/\*/g, '.*')
          .replace(/@(\w+)/g, '(.+)');
        
        const hasVariables = /@\w+/.test(command.content);
        const commands = command.content.split(';').filter(c => c.trim());
        
        let script: string;
        if (hasVariables) {
          const luaCommands = commands.map(cmd => buildVipMudSendCommand(cmd.trim()));
          script = `-- Converted from VIPMud\n-- Original: ${escapeLuaString(command.content)}\n${luaCommands.join('\n')}`;
        } else {
          script = `-- Converted from VIPMud\n${commands.map(c => `send("${escapeLuaString(c.trim())}")`).join('\n')}`;
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
    return { triggers, aliases, keybindings };
  }
  
  const aliasMatch = trimmed.match(/^#ALIAS\s+/i);
  if (aliasMatch) {
    const afterCommand = trimmed.substring(aliasMatch[0].length);
    const nameEnd = afterCommand.indexOf(' ');
    const hasBraces = afterCommand.includes('{');
    
    let name: string;
    let commandContent: string;
    
    if (hasBraces) {
      const braceStart = afterCommand.indexOf('{');
      name = afterCommand.substring(0, braceStart).trim();
      const command = extractBraces(afterCommand, braceStart);
      commandContent = command ? command.content : '';
    } else {
      name = afterCommand.substring(0, nameEnd > 0 ? nameEnd : afterCommand.length).trim();
      commandContent = nameEnd > 0 ? afterCommand.substring(nameEnd + 1).trim() : '';
    }
    
    if (name) {
      const convertedPattern = `^${name}(?:\\s+(.*))?$`;
      const hasVariables = /@\w+/.test(commandContent);
      const commands = commandContent.split(';').filter(c => c.trim());
      
      let commandValue: string;
      if (hasVariables) {
        const luaCommands = commands.map(cmd => buildVipMudSendCommand(cmd.trim()));
        commandValue = `-- Converted from VIPMud\n-- Original: ${escapeLuaString(commandContent)}\n${luaCommands.join('\n')}`;
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
    return { triggers, aliases, keybindings };
  }
  
  const keyMatch = trimmed.match(/^#KEY\s+/i);
  if (keyMatch) {
    const afterCommand = trimmed.substring(keyMatch[0].length);
    const keyEnd = afterCommand.indexOf(' ');
    const keyName = afterCommand.substring(0, keyEnd > 0 ? keyEnd : afterCommand.length).trim();
    
    let commandContent = '';
    const braceStart = afterCommand.indexOf('{');
    if (braceStart >= 0) {
      const command = extractBraces(afterCommand, braceStart);
      commandContent = command ? command.content : '';
    } else if (keyEnd > 0) {
      commandContent = afterCommand.substring(keyEnd + 1).trim();
    }
    
    const keyMap: Record<string, string> = {
      'F1': 'F1', 'F2': 'F2', 'F3': 'F3', 'F4': 'F4', 'F5': 'F5',
      'F6': 'F6', 'F7': 'F7', 'F8': 'F8', 'F9': 'F9', 'F10': 'F10',
      'F11': 'F11', 'F12': 'F12',
      'NUMPAD0': 'Numpad0', 'NUMPAD1': 'Numpad1', 'NUMPAD2': 'Numpad2',
      'NUMPAD3': 'Numpad3', 'NUMPAD4': 'Numpad4', 'NUMPAD5': 'Numpad5',
      'NUMPAD6': 'Numpad6', 'NUMPAD7': 'Numpad7', 'NUMPAD8': 'Numpad8',
      'NUMPAD9': 'Numpad9',
    };
    
    const webKey = keyMap[keyName.toUpperCase()] || keyName;
    const hasVariables = /@\w+/.test(commandContent);
    const commands = commandContent.split(';').filter(c => c.trim());
    
    let commandValue: string;
    if (hasVariables) {
      const luaCommands = commands.map(cmd => buildVipMudSendCommand(cmd.trim()));
      commandValue = `-- Converted from VIPMud\n-- Original: ${escapeLuaString(commandContent)}\n${luaCommands.join('\n')}`;
    } else {
      commandValue = commands.map(c => c.trim()).join('\n');
    }
    
    keybindings.push({
      id: generateId(),
      key: webKey,
      command: commandValue,
      isScript: hasVariables,
      active: true,
      classId: undefined,
    });
    return { triggers, aliases, keybindings };
  }
  
  return { triggers, aliases, keybindings };
}

export function parseVipMudConfig(content: string): PackageContents {
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
    const result = parseVipMudLine(line, context);
    contents.triggers!.push(...result.triggers);
    contents.aliases!.push(...result.aliases);
    contents.keybindings!.push(...result.keybindings);
  }
  
  contents.classes = context.classes;
  
  return contents;
}

export function getVipMudImportSummary(contents: PackageContents): string {
  const parts: string[] = [];
  if (contents.triggers && contents.triggers.length) parts.push(`${contents.triggers.length} triggers`);
  if (contents.aliases && contents.aliases.length) parts.push(`${contents.aliases.length} aliases`);
  if (contents.keybindings && contents.keybindings.length) parts.push(`${contents.keybindings.length} keybindings`);
  if (contents.classes && contents.classes.length) parts.push(`${contents.classes.length} classes`);
  return parts.join(', ') || 'No items found';
}
