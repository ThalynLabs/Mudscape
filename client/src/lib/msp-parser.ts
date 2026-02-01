import { soundManager } from './sound-manager';

export interface MSPSoundCommand {
  type: 'sound' | 'music';
  name: string;
  volume?: number;
  repeat?: number;
  priority?: number;
  url?: string;
}

export function parseMSP(line: string): { cleanLine: string; commands: MSPSoundCommand[] } {
  const commands: MSPSoundCommand[] = [];
  let cleanLine = line;

  const soundRegex = /!!SOUND\(([^)]+)\)/gi;
  const musicRegex = /!!MUSIC\(([^)]+)\)/gi;

  cleanLine = cleanLine.replace(soundRegex, (match, params) => {
    const command = parseMSPParams('sound', params);
    if (command) commands.push(command);
    return '';
  });

  cleanLine = cleanLine.replace(musicRegex, (match, params) => {
    const command = parseMSPParams('music', params);
    if (command) commands.push(command);
    return '';
  });

  return { cleanLine: cleanLine.trim(), commands };
}

function parseMSPParams(type: 'sound' | 'music', params: string): MSPSoundCommand | null {
  const parts = params.split(/\s+/);
  if (parts.length === 0) return null;

  const name = parts[0];
  const command: MSPSoundCommand = { type, name };

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const [key, value] = part.split('=');
    
    switch (key?.toLowerCase()) {
      case 'v':
      case 'vol':
      case 'volume':
        command.volume = parseInt(value, 10) / 100;
        break;
      case 'l':
      case 'loop':
      case 'repeat':
        command.repeat = parseInt(value, 10);
        break;
      case 'p':
      case 'priority':
        command.priority = parseInt(value, 10);
        break;
      case 'u':
      case 'url':
        command.url = value;
        break;
    }
  }

  return command;
}

export function executeMSPCommands(commands: MSPSoundCommand[]): void {
  for (const cmd of commands) {
    const volume = cmd.volume ?? 1.0;
    const loop = cmd.repeat === -1 || cmd.repeat === 0;
    
    if (cmd.type === 'music') {
      soundManager.loop(cmd.name, volume);
    } else {
      if (loop) {
        soundManager.loop(cmd.name, volume);
      } else {
        soundManager.play(cmd.name, volume, false);
      }
    }
  }
}

export function processLineForMSP(line: string): string {
  const { cleanLine, commands } = parseMSP(line);
  
  if (commands.length > 0) {
    executeMSPCommands(commands);
  }
  
  return cleanLine;
}
