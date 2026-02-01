import JSZip from 'jszip';
import type { MudTrigger, MudAlias, MudTimer, MudKeybinding, MudButton, MudScript, MudClass, PackageContents } from '@shared/schema';

interface MudletParseResult {
  success: boolean;
  contents?: PackageContents;
  name?: string;
  error?: string;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function getTextContent(element: Element, tagName: string): string {
  const child = element.querySelector(`:scope > ${tagName}`);
  return child?.textContent?.trim() || '';
}

function getBooleanAttr(element: Element, attrName: string): boolean {
  const attr = element.getAttribute(attrName);
  return attr === 'yes' || attr === 'true' || attr === '1';
}

function parseTriggerType(typeInt: number): 'regex' | 'plain' {
  return typeInt === 1 ? 'regex' : 'plain';
}

function parseRegexPropertyType(typeInt: number): 'regex' | 'plain' {
  switch (typeInt) {
    case 1: return 'regex';
    case 0: 
    case 2:
    case 3:
    case 4:
    default: return 'plain';
  }
}

interface ParseContext {
  classes: MudClass[];
  classPathMap: Map<string, string>;
}

function getOrCreateClass(name: string, isActive: boolean, context: ParseContext, parentClassId?: string): string {
  const path = parentClassId ? `${parentClassId}/${name}` : name;
  
  const existingId = context.classPathMap.get(path);
  if (existingId) return existingId;
  
  const newClass: MudClass = {
    id: generateId(),
    name,
    active: isActive,
  };
  context.classes.push(newClass);
  context.classPathMap.set(path, newClass.id);
  return newClass.id;
}

function parseMudletTrigger(element: Element, context: ParseContext, parentClassId?: string): MudTrigger[] {
  const triggers: MudTrigger[] = [];
  const isFolder = getBooleanAttr(element, 'isFolder');
  const isActive = getBooleanAttr(element, 'isActive');
  const name = getTextContent(element, 'name');
  const script = getTextContent(element, 'script');
  
  if (isFolder) {
    const classId = name ? getOrCreateClass(name, isActive, context, parentClassId) : parentClassId;
    const childTriggers = element.querySelectorAll(':scope > Trigger, :scope > TriggerGroup');
    childTriggers.forEach(child => {
      triggers.push(...parseMudletTrigger(child, context, classId));
    });
  } else {
    const regexList = element.querySelector(':scope > regexCodeList');
    const regexProps = element.querySelector(':scope > regexCodePropertyList');
    
    const patterns: string[] = [];
    const patternTypes: number[] = [];
    
    if (regexList) {
      regexList.querySelectorAll(':scope > string').forEach(s => {
        const pattern = s.textContent?.trim();
        if (pattern) patterns.push(pattern);
      });
    }
    
    if (regexProps) {
      regexProps.querySelectorAll(':scope > integer').forEach(i => {
        patternTypes.push(parseInt(i.textContent || '0', 10));
      });
    }
    
    if (patterns.length > 0 || script) {
      const pattern = patterns[0] || '';
      const patternType = parseRegexPropertyType(patternTypes[0] || 0);
      
      const soundFile = getTextContent(element, 'mSoundFile');
      
      triggers.push({
        id: generateId(),
        pattern,
        type: patternType,
        script: script || '',
        classId: parentClassId,
        active: isActive,
        soundFile: soundFile || undefined,
      });
    }
  }
  
  return triggers;
}

function parseMudletAlias(element: Element, context: ParseContext, parentClassId?: string): MudAlias[] {
  const aliases: MudAlias[] = [];
  const isFolder = getBooleanAttr(element, 'isFolder');
  const isActive = getBooleanAttr(element, 'isActive');
  const name = getTextContent(element, 'name');
  
  if (isFolder) {
    const classId = name ? getOrCreateClass(name, isActive, context, parentClassId) : parentClassId;
    const childAliases = element.querySelectorAll(':scope > Alias');
    childAliases.forEach(child => {
      aliases.push(...parseMudletAlias(child, context, classId));
    });
  } else {
    const pattern = getTextContent(element, 'regex');
    const script = getTextContent(element, 'script');
    const command = getTextContent(element, 'command');
    
    if (pattern) {
      aliases.push({
        id: generateId(),
        pattern,
        command: script || command || '',
        isScript: !!script,
        classId: parentClassId,
        active: isActive,
      });
    }
  }
  
  return aliases;
}

function parseMudletTimer(element: Element, context: ParseContext, parentClassId?: string): MudTimer[] {
  const timers: MudTimer[] = [];
  const isFolder = getBooleanAttr(element, 'isFolder');
  const isActive = getBooleanAttr(element, 'isActive');
  const isTempTimer = getBooleanAttr(element, 'isTempTimer');
  const name = getTextContent(element, 'name');
  
  if (isFolder) {
    const classId = name ? getOrCreateClass(name, isActive, context, parentClassId) : parentClassId;
    const childTimers = element.querySelectorAll(':scope > Timer');
    childTimers.forEach(child => {
      timers.push(...parseMudletTimer(child, context, classId));
    });
  } else {
    const script = getTextContent(element, 'script');
    const timeStr = getTextContent(element, 'time');
    
    let intervalMs = 0;
    if (timeStr) {
      const match = timeStr.match(/(\d+):(\d+):(\d+)\.?(\d+)?/);
      if (match) {
        const hours = parseInt(match[1], 10);
        const mins = parseInt(match[2], 10);
        const secs = parseInt(match[3], 10);
        const ms = parseInt(match[4] || '0', 10);
        intervalMs = (hours * 3600 + mins * 60 + secs) * 1000 + ms;
      }
    }
    
    if (intervalMs > 0 || script) {
      timers.push({
        id: generateId(),
        name: name || 'Imported Timer',
        interval: intervalMs || 1000,
        oneShot: isTempTimer,
        script: script || '',
        classId: parentClassId,
        active: isActive,
      });
    }
  }
  
  return timers;
}

function parseMudletKey(element: Element, context: ParseContext, parentClassId?: string): MudKeybinding[] {
  const keybindings: MudKeybinding[] = [];
  const isFolder = getBooleanAttr(element, 'isFolder');
  const isActive = getBooleanAttr(element, 'isActive');
  const name = getTextContent(element, 'name');
  
  if (isFolder) {
    const classId = name ? getOrCreateClass(name, isActive, context, parentClassId) : parentClassId;
    const childKeys = element.querySelectorAll(':scope > Key');
    childKeys.forEach(child => {
      keybindings.push(...parseMudletKey(child, context, classId));
    });
  } else {
    const script = getTextContent(element, 'script');
    const command = getTextContent(element, 'command');
    const keyCode = getTextContent(element, 'keyCode');
    const keyModifier = getTextContent(element, 'keyModifier');
    
    const keyCombo = convertMudletKeyCode(parseInt(keyCode || '0', 10), parseInt(keyModifier || '0', 10));
    
    if (keyCombo) {
      keybindings.push({
        id: generateId(),
        key: keyCombo,
        command: script || command || '',
        isScript: !!script,
        classId: parentClassId,
        active: isActive,
      });
    }
  }
  
  return keybindings;
}

function convertMudletKeyCode(keyCode: number, modifier: number): string {
  const modifiers: string[] = [];
  if (modifier & 0x02000000) modifiers.push('Ctrl');
  if (modifier & 0x04000000) modifiers.push('Alt');
  if (modifier & 0x08000000) modifiers.push('Meta');
  if (modifier & 0x01000000) modifiers.push('Shift');
  
  const keyMap: Record<number, string> = {
    0x01000000: 'Escape',
    0x01000001: 'Tab',
    0x01000003: 'Backspace',
    0x01000004: 'Return',
    0x01000005: 'Enter',
    0x01000006: 'Insert',
    0x01000007: 'Delete',
    0x01000010: 'Home',
    0x01000011: 'End',
    0x01000012: 'Left',
    0x01000013: 'Up',
    0x01000014: 'Right',
    0x01000015: 'Down',
    0x01000016: 'PageUp',
    0x01000017: 'PageDown',
    0x01000030: 'F1',
    0x01000031: 'F2',
    0x01000032: 'F3',
    0x01000033: 'F4',
    0x01000034: 'F5',
    0x01000035: 'F6',
    0x01000036: 'F7',
    0x01000037: 'F8',
    0x01000038: 'F9',
    0x01000039: 'F10',
    0x0100003a: 'F11',
    0x0100003b: 'F12',
    0x20: 'Space',
  };
  
  let key = keyMap[keyCode];
  if (!key && keyCode >= 0x20 && keyCode <= 0x7E) {
    key = String.fromCharCode(keyCode).toUpperCase();
  }
  
  if (!key) return '';
  
  if (modifiers.length > 0) {
    return modifiers.join('+') + '+' + key;
  }
  return key;
}

function parseMudletAction(element: Element, context: ParseContext, parentClassId?: string): MudButton[] {
  const buttons: MudButton[] = [];
  const isFolder = getBooleanAttr(element, 'isFolder');
  const isActive = getBooleanAttr(element, 'isActive');
  const name = getTextContent(element, 'name');
  
  if (isFolder) {
    const classId = name ? getOrCreateClass(name, isActive, context, parentClassId) : parentClassId;
    const childActions = element.querySelectorAll(':scope > Action');
    childActions.forEach(child => {
      buttons.push(...parseMudletAction(child, context, classId));
    });
  } else {
    const script = getTextContent(element, 'script');
    const command = getTextContent(element, 'command');
    const buttonColor = getTextContent(element, 'buttonColor');
    
    if (name || script || command) {
      buttons.push({
        id: generateId(),
        label: name || 'Imported Button',
        command: script || command || '',
        isScript: !!script,
        color: buttonColor || undefined,
        classId: parentClassId,
        active: isActive,
      });
    }
  }
  
  return buttons;
}

function parseMudletScript(element: Element, context: ParseContext, parentClassId?: string): MudScript[] {
  const scripts: MudScript[] = [];
  const isFolder = getBooleanAttr(element, 'isFolder');
  const isActive = getBooleanAttr(element, 'isActive');
  const name = getTextContent(element, 'name');
  
  if (isFolder) {
    const classId = name ? getOrCreateClass(name, isActive, context, parentClassId) : parentClassId;
    const childScripts = element.querySelectorAll(':scope > Script');
    childScripts.forEach(child => {
      scripts.push(...parseMudletScript(child, context, classId));
    });
  } else {
    const script = getTextContent(element, 'script');
    
    if (script) {
      scripts.push({
        id: generateId(),
        name: name || 'Imported Script',
        content: script,
        classId: parentClassId,
        active: isActive,
      });
    }
  }
  
  return scripts;
}

function parseMudletXml(xmlString: string): PackageContents {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');
  
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
    scripts: [],
    classes: [],
  };
  
  const triggerPackage = doc.querySelector('TriggerPackage');
  if (triggerPackage) {
    triggerPackage.querySelectorAll(':scope > Trigger, :scope > TriggerGroup').forEach(el => {
      contents.triggers!.push(...parseMudletTrigger(el, context));
    });
  }
  
  const aliasPackage = doc.querySelector('AliasPackage');
  if (aliasPackage) {
    aliasPackage.querySelectorAll(':scope > Alias').forEach(el => {
      contents.aliases!.push(...parseMudletAlias(el, context));
    });
  }
  
  const timerPackage = doc.querySelector('TimerPackage');
  if (timerPackage) {
    timerPackage.querySelectorAll(':scope > Timer').forEach(el => {
      contents.timers!.push(...parseMudletTimer(el, context));
    });
  }
  
  const keyPackage = doc.querySelector('KeyPackage');
  if (keyPackage) {
    keyPackage.querySelectorAll(':scope > Key').forEach(el => {
      contents.keybindings!.push(...parseMudletKey(el, context));
    });
  }
  
  const actionPackage = doc.querySelector('ActionPackage');
  if (actionPackage) {
    actionPackage.querySelectorAll(':scope > Action').forEach(el => {
      contents.buttons!.push(...parseMudletAction(el, context));
    });
  }
  
  const scriptPackage = doc.querySelector('ScriptPackage');
  if (scriptPackage) {
    scriptPackage.querySelectorAll(':scope > Script').forEach(el => {
      contents.scripts!.push(...parseMudletScript(el, context));
    });
  }
  
  contents.classes = context.classes;
  
  return contents;
}

export async function parseMudletPackage(file: File): Promise<MudletParseResult> {
  const fileName = file.name.toLowerCase();
  
  try {
    if (fileName.endsWith('.mpackage') || fileName.endsWith('.zip')) {
      const zip = new JSZip();
      const zipData = await zip.loadAsync(file);
      
      let xmlContent: string | null = null;
      let packageName = file.name.replace(/\.(mpackage|zip)$/i, '');
      
      for (const [name, zipFile] of Object.entries(zipData.files)) {
        if (!zipFile.dir && name.endsWith('.xml')) {
          xmlContent = await zipFile.async('string');
          packageName = name.replace('.xml', '');
          break;
        }
      }
      
      const configLua = zipData.files['config.lua'];
      if (configLua) {
        const configContent = await configLua.async('string');
        const match = configContent.match(/mpackage\s*=\s*["']([^"']+)["']/);
        if (match) {
          packageName = match[1];
        }
      }
      
      if (!xmlContent) {
        return { success: false, error: 'No XML file found in package' };
      }
      
      const contents = parseMudletXml(xmlContent);
      return { success: true, contents, name: packageName };
      
    } else if (fileName.endsWith('.xml')) {
      const xmlContent = await file.text();
      const contents = parseMudletXml(xmlContent);
      const packageName = file.name.replace('.xml', '');
      return { success: true, contents, name: packageName };
      
    } else {
      return { success: false, error: 'Unsupported file format. Use .mpackage, .zip, or .xml' };
    }
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Failed to parse Mudlet package' 
    };
  }
}

export function getImportSummary(contents: PackageContents): string {
  const parts: string[] = [];
  if (contents.triggers?.length) parts.push(`${contents.triggers.length} triggers`);
  if (contents.aliases?.length) parts.push(`${contents.aliases.length} aliases`);
  if (contents.timers?.length) parts.push(`${contents.timers.length} timers`);
  if (contents.keybindings?.length) parts.push(`${contents.keybindings.length} keybindings`);
  if (contents.buttons?.length) parts.push(`${contents.buttons.length} buttons`);
  if (contents.scripts?.length) parts.push(`${contents.scripts.length} scripts`);
  if (contents.classes?.length) parts.push(`${contents.classes.length} classes`);
  return parts.join(', ') || 'No items found';
}
