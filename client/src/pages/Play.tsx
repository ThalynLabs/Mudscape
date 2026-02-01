import { useEffect, useRef, useState, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import { useQuery } from "@tanstack/react-query";
import { useProfile, useUpdateProfile } from "@/hooks/use-profiles";
import { TerminalLine } from "@/components/TerminalLine";
import { SettingsPanel } from "@/components/SettingsPanel";
import { TimersPanel } from "@/components/TimersPanel";
import { KeybindingsPanel } from "@/components/KeybindingsPanel";
import { TriggersPanel } from "@/components/TriggersPanel";
import { AliasesPanel } from "@/components/AliasesPanel";
import { ButtonsPanel } from "@/components/ButtonsPanel";
import { PackageManager } from "@/components/PackageManager";
import { VariablesPanel } from "@/components/VariablesPanel";
import { ClassesPanel } from "@/components/ClassesPanel";
import { SoundpackPanel } from "@/components/SoundpackPanel";
import { ScriptAssistant } from "@/components/ScriptAssistant";
import { ConnectionTabs } from "@/components/ConnectionTabs";
import { AddConnectionDialog } from "@/components/AddConnectionDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Wifi, WifiOff, ArrowDown, Clock, Keyboard, Volume2, Zap, Terminal, SquareMousePointer, Package, Wand2, Library, Unplug } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { WsClientMessage, WsServerMessage, GlobalSettings, ProfileSettings, MudTrigger, MudAlias, MudTimer, MudKeybinding, MudButton, MudClass, MudVariables, SoundpackRow, mergeSettings, DEFAULT_GLOBAL_SETTINGS, Profile } from "@shared/schema";
import { clsx } from "clsx";
import { useSpeech } from "@/hooks/use-speech";
import { processTriggers, processAlias } from "@/lib/scripting";
import { initLuaEngine, setScriptContext, executeLuaScript, destroyLuaEngine } from "@/lib/lua-scripting";
import { soundManager } from "@/lib/sound-manager";
import { processLineForMSP } from "@/lib/msp-parser";
import { useTimers } from "@/hooks/use-timers";
import { useKeybindings } from "@/hooks/use-keybindings";
import { ConnectionTab, createConnectionId } from "@/lib/connection-manager";

// Hardcoded maximum lines to keep in buffer to prevent memory leaks
const MAX_LINES = 5000;

// Strip ANSI codes for speech
function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, "").trim();
}

interface ConnectionState {
  id: string;
  profileId: number;
  profile: Profile;
  lines: string[];
  isConnected: boolean;
  unreadCount: number;
  socket: WebSocket | null;
}

export default function Play() {
  const [, params] = useRoute("/play/:id");
  const [, navigate] = useLocation();
  const initialProfileId = parseInt(params?.id || "0");
  const { data: initialProfile } = useProfile(initialProfileId);
  const { toast } = useToast();
  
  // Multi-MUD connection state
  const [connections, setConnections] = useState<ConnectionState[]>([]);
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);
  const [addConnectionOpen, setAddConnectionOpen] = useState(false);
  const initializedRef = useRef(false);
  
  // Get active connection
  const activeConnection = connections.find(c => c.id === activeConnectionId);
  const profile = activeConnection?.profile;
  const profileId = activeConnection?.profileId ?? 0;
  
  // Derive terminal state from active connection (single source of truth)
  const lines = activeConnection?.lines ?? [];
  const isConnected = activeConnection?.isConnected ?? false;
  
  // Temporary automation state (runtime-only, not persisted)
  const tempTriggersRef = useRef<Array<{ id: string; pattern: string; script: string; timeout?: number; createdAt: number }>>([]);
  const tempAliasesRef = useRef<Array<{ id: string; pattern: string; script: string }>>([]);
  const tempTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // Multi-line trigger buffer - stores recent lines for pattern matching
  const lineBufferRef = useRef<string[]>([]);
  const MAX_LINE_BUFFER = 20; // Maximum lines to keep in buffer
  
  // Line modification state for current trigger execution
  const lineModificationsRef = useRef<{ gagged: boolean; replacements: Array<{ old: string; new: string }> }>({ gagged: false, replacements: [] });
  
  // User-friendly helper state
  const [gauges, setGauges] = useState<Map<string, { current: number; max: number; color?: string }>>(new Map());
  const sessionLogRef = useRef<string[]>([]);
  
  const [inputValue, setInputValue] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [timersOpen, setTimersOpen] = useState(false);
  const [keybindingsOpen, setKeybindingsOpen] = useState(false);
  const [triggersOpen, setTriggersOpen] = useState(false);
  const [aliasesOpen, setAliasesOpen] = useState(false);
  const [buttonsOpen, setButtonsOpen] = useState(false);
  const [packagesOpen, setPackagesOpen] = useState(false);
  const [scriptAssistantOpen, setScriptAssistantOpen] = useState(false);
  const [gmcpData, setGmcpData] = useState<Record<string, unknown>>({});

  // Refs
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const executeScriptRef = useRef<((script: string, line?: string, matches?: string[], namedCaptures?: Record<string, string>) => Promise<void>) | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch global settings
  const { data: globalSettings } = useQuery<GlobalSettings>({
    queryKey: ['/api/settings'],
  });
  
  // Merge global settings with profile overrides
  const profileSettings = (profile?.settings || {}) as ProfileSettings;
  const settings = mergeSettings(globalSettings ?? DEFAULT_GLOBAL_SETTINGS, profileSettings);
  const triggers = (profile?.triggers || []) as MudTrigger[];
  const aliases = (profile?.aliases || []) as MudAlias[];
  const timers = (profile?.timers || []) as MudTimer[];
  const keybindings = (profile?.keybindings || []) as MudKeybinding[];
  const classes = (profile?.classes || []) as MudClass[];
  const [variables, setVariables] = useState<MudVariables>((profile?.variables || {}) as MudVariables);
  const activeSoundpackId = profile?.activeSoundpackId;
  const updateProfile = useUpdateProfile();

  // Initialize first connection when profile loads
  useEffect(() => {
    if (initialProfile && !initializedRef.current) {
      initializedRef.current = true;
      const connId = createConnectionId(initialProfile.id);
      setConnections([{
        id: connId,
        profileId: initialProfile.id,
        profile: initialProfile,
        lines: [],
        isConnected: false,
        unreadCount: 0,
        socket: null,
      }]);
      setActiveConnectionId(connId);
    }
  }, [initialProfile]);

  // Clear unread count when switching to this connection
  useEffect(() => {
    if (activeConnectionId) {
      setConnections(prev => prev.map(c => 
        c.id === activeConnectionId ? { ...c, unreadCount: 0 } : c
      ));
    }
  }, [activeConnectionId]);

  // Add new connection
  const addConnection = useCallback((newProfile: Profile) => {
    const connId = createConnectionId(newProfile.id);
    setConnections(prev => [...prev, {
      id: connId,
      profileId: newProfile.id,
      profile: newProfile,
      lines: [],
      isConnected: false,
      unreadCount: 0,
      socket: null,
    }]);
    setActiveConnectionId(connId);
  }, []);

  // Close connection
  const closeConnection = useCallback((connId: string) => {
    setConnections(prev => {
      const conn = prev.find(c => c.id === connId);
      if (conn?.socket) {
        conn.socket.close();
      }
      const remaining = prev.filter(c => c.id !== connId);
      // If we closed the active connection, switch to another
      if (connId === activeConnectionId && remaining.length > 0) {
        setActiveConnectionId(remaining[0].id);
      } else if (remaining.length === 0) {
        // No connections left, go back to library
        navigate('/');
      }
      return remaining;
    });
  }, [activeConnectionId, navigate]);

  // Get tabs for UI
  const connectionTabs: ConnectionTab[] = connections.map(c => ({
    id: c.id,
    profileId: c.profileId,
    profileName: c.profile.name,
    isConnected: c.isConnected,
    unreadCount: c.unreadCount,
  }));

  // Update connection state helper
  const updateConnectionState = useCallback((connId: string, updates: Partial<ConnectionState>) => {
    setConnections(prev => prev.map(c => 
      c.id === connId ? { ...c, ...updates } : c
    ));
  }, []);

  // Add lines to a connection
  const addLinesToConnection = useCallback((connId: string, newLines: string[]) => {
    setConnections(prev => prev.map(c => {
      if (c.id === connId) {
        const updatedLines = [...c.lines, ...newLines].slice(-MAX_LINES);
        const unreadCount = c.id === activeConnectionId ? 0 : c.unreadCount + newLines.length;
        return { ...c, lines: updatedLines, unreadCount };
      }
      return c;
    }));
  }, [activeConnectionId]);
  
  const isClassActive = useCallback((classId?: string) => {
    if (!classId) return true;
    const cls = classes.find(c => c.id === classId);
    return cls ? cls.active : true;
  }, [classes]);
  
  const { speak, speakLine, cancel: cancelSpeech, togglePause, paused, voices } = useSpeech({
    enabled: settings.speechEnabled ?? false,
    rate: settings.speechRate ?? 1,
    volume: settings.speechVolume ?? 1,
    pitch: settings.speechPitch ?? 1,
    voiceURI: settings.speechVoice ?? undefined,
  });
  
  // Scripting helpers - must be defined before handleClientCommand
  // Get the active connection's socket
  const getActiveSocket = useCallback((): WebSocket | null => {
    const activeConn = connections.find(c => c.id === activeConnectionId);
    return activeConn?.socket || null;
  }, [connections, activeConnectionId]);
  
  const sendCommand = useCallback((cmd: string) => {
    const socket = getActiveSocket();
    if (socket && socket.readyState === WebSocket.OPEN) {
      const msg: WsClientMessage = { type: 'send', data: cmd };
      socket.send(JSON.stringify(msg));
    }
  }, [getActiveSocket]);

  const echoLocal = useCallback((text: string) => {
    if (activeConnectionId) {
      addLinesToConnection(activeConnectionId, [`\x1b[33m${text}\x1b[0m`]);
    }
    // If no active connection, silently drop the echo
  }, [activeConnectionId, addLinesToConnection]);
  
  // Update profile settings helper (for in-game commands)
  const updateProfileSetting = useCallback((key: keyof ProfileSettings, value: any) => {
    if (!profile) return;
    const newSettings = { ...(profile.settings as ProfileSettings || {}), [key]: value };
    updateProfile.mutate({ id: profile.id, settings: newSettings });
  }, [profile, updateProfile]);
  
  // Handle client-side commands (start with /)
  const handleClientCommand = useCallback((cmd: string): boolean => {
    const prefix = settings.commandPrefix ?? '/';
    const parts = cmd.trim().split(/\s+/);
    const command = parts[0].toLowerCase();
    
    // Check if this is a client command (starts with prefix)
    if (!command.startsWith(prefix)) {
      return false;
    }
    
    // Remove prefix from command
    const baseCommand = command.slice(prefix.length);
    const args = parts.slice(1);
    
    // Helper to show help text with current prefix
    const showHelp = () => {
      echoLocal('\x1b[36m=== Mudscape Quick Help ===\x1b[0m');
      echoLocal('');
      echoLocal('\x1b[33mGetting Started:\x1b[0m');
      echoLocal(`Type commands in the input box below and press Enter to send to the MUD.`);
      echoLocal(`Commands starting with "${prefix}config" are Mudscape commands, not sent to the MUD.`);
      echoLocal('');
      echoLocal('\x1b[33mConfiguration Commands:\x1b[0m');
      echoLocal(`  ${prefix}config speech on|off   - Toggle text-to-speech`);
      echoLocal(`  ${prefix}config rate <0.5-2>    - Adjust speech speed`);
      echoLocal(`  ${prefix}config volume <0-100>  - Adjust speech volume`);
      echoLocal(`  ${prefix}config voice           - List or set voice`);
      echoLocal(`  ${prefix}config triggers on|off - Toggle automation triggers`);
      echoLocal(`  ${prefix}config aliases on|off  - Toggle command aliases`);
      echoLocal(`  ${prefix}config keep on|off     - Toggle keeping input after Enter`);
      echoLocal(`  ${prefix}config reader on|off   - Toggle reader mode`);
      echoLocal(`  ${prefix}config prefix <char>   - Change command prefix (current: "${prefix}")`);
      echoLocal(`  ${prefix}config settings        - Open settings panel`);
      echoLocal('');
      echoLocal('\x1b[33mKeyboard Shortcuts:\x1b[0m');
      echoLocal('  Ctrl+1-9      - Read recent lines aloud');
      echoLocal('  Ctrl Ctrl     - Double-tap to pause/resume speech');
      echoLocal('  Escape        - Clear the input line');
      echoLocal('  F1            - Open detailed help wiki');
      echoLocal('');
      echoLocal('\x1b[32mPress F1 for the full help wiki with detailed documentation.\x1b[0m');
    };
    
    // Handle help command (works with just prefix + help)
    if (baseCommand === 'help' || baseCommand === 'commands') {
      showHelp();
      return true;
    }
    
    // Handle config command
    if (baseCommand === 'config') {
      const feature = args[0]?.toLowerCase();
      const option = args[1];
      const extraArgs = args.slice(2);
      
      if (!feature) {
        showHelp();
        return true;
      }
      
      switch (feature) {
        case 'help':
          showHelp();
          return true;
          
        case 'speech':
          if (option === 'on') {
            updateProfileSetting('speechEnabled', true);
            echoLocal('\x1b[32mSpeech enabled\x1b[0m');
            speak('Speech enabled', true);
          } else if (option === 'off') {
            updateProfileSetting('speechEnabled', false);
            cancelSpeech();
            echoLocal('\x1b[33mSpeech disabled\x1b[0m');
          } else {
            echoLocal(`Speech is currently ${settings.speechEnabled ? 'on' : 'off'}`);
            echoLocal(`Usage: ${prefix}config speech on|off`);
          }
          return true;
          
        case 'rate':
          if (option) {
            const rate = parseFloat(option);
            if (!isNaN(rate) && rate >= 0.5 && rate <= 2) {
              updateProfileSetting('speechRate', rate);
              echoLocal(`\x1b[32mSpeech rate set to ${rate}x\x1b[0m`);
              speak(`Rate set to ${rate}`, true);
            } else {
              echoLocal('\x1b[31mRate must be between 0.5 and 2\x1b[0m');
            }
          } else {
            echoLocal(`Current speech rate: ${settings.speechRate ?? 1}x`);
            echoLocal(`Usage: ${prefix}config rate <0.5-2>`);
          }
          return true;
          
        case 'volume':
          if (option) {
            const vol = parseFloat(option);
            if (!isNaN(vol) && vol >= 0 && vol <= 100) {
              updateProfileSetting('speechVolume', vol / 100);
              echoLocal(`\x1b[32mSpeech volume set to ${vol}%\x1b[0m`);
              speak(`Volume set to ${vol} percent`, true);
            } else {
              echoLocal('\x1b[31mVolume must be between 0 and 100\x1b[0m');
            }
          } else {
            echoLocal(`Current speech volume: ${((settings.speechVolume ?? 1) * 100).toFixed(0)}%`);
            echoLocal(`Usage: ${prefix}config volume <0-100>`);
          }
          return true;
          
        case 'pitch':
          if (option) {
            const pitch = parseFloat(option);
            if (!isNaN(pitch) && pitch >= 0.5 && pitch <= 2) {
              updateProfileSetting('speechPitch', pitch);
              echoLocal(`\x1b[32mSpeech pitch set to ${pitch}\x1b[0m`);
              speak(`Pitch set to ${pitch}`, true);
            } else {
              echoLocal('\x1b[31mPitch must be between 0.5 and 2\x1b[0m');
            }
          } else {
            echoLocal(`Current speech pitch: ${settings.speechPitch ?? 1}`);
            echoLocal(`Usage: ${prefix}config pitch <0.5-2>`);
          }
          return true;
          
        case 'voice':
          if (option) {
            const idx = parseInt(option) - 1;
            if (!isNaN(idx) && idx >= 0 && idx < voices.length) {
              const voice = voices[idx];
              updateProfileSetting('speechVoice', voice.voiceURI);
              echoLocal(`\x1b[32mVoice set to: ${voice.name}\x1b[0m`);
              speak(`Voice set to ${voice.name}`, true);
            } else {
              echoLocal(`\x1b[31mInvalid voice number. Use ${prefix}config voice to see available voices.\x1b[0m`);
            }
          } else {
            echoLocal('\x1b[32m=== Available Voices ===\x1b[0m');
            voices.forEach((v, i) => {
              const current = v.voiceURI === settings.speechVoice ? ' (current)' : '';
              echoLocal(`${i + 1}. ${v.name}${current}`);
            });
            echoLocal(`Usage: ${prefix}config voice <number>`);
          }
          return true;
          
        case 'settings':
          setSettingsOpen(true);
          echoLocal('\x1b[32mOpening settings panel...\x1b[0m');
          return true;
          
        case 'triggers':
          if (option === 'on') {
            updateProfileSetting('triggersEnabled', true);
            echoLocal('\x1b[32mTriggers enabled\x1b[0m');
          } else if (option === 'off') {
            updateProfileSetting('triggersEnabled', false);
            echoLocal('\x1b[33mTriggers disabled\x1b[0m');
          } else {
            echoLocal(`Triggers are currently ${settings.triggersEnabled !== false ? 'on' : 'off'}`);
            echoLocal(`Usage: ${prefix}config triggers on|off`);
          }
          return true;
          
        case 'aliases':
          if (option === 'on') {
            updateProfileSetting('aliasesEnabled', true);
            echoLocal('\x1b[32mAliases enabled\x1b[0m');
          } else if (option === 'off') {
            updateProfileSetting('aliasesEnabled', false);
            echoLocal('\x1b[33mAliases disabled\x1b[0m');
          } else {
            echoLocal(`Aliases are currently ${settings.aliasesEnabled !== false ? 'on' : 'off'}`);
            echoLocal(`Usage: ${prefix}config aliases on|off`);
          }
          return true;
          
        case 'reader':
          if (option === 'on') {
            updateProfileSetting('readerMode', true);
            echoLocal('\x1b[32mReader mode enabled - speech pauses until you press Enter\x1b[0m');
          } else if (option === 'off') {
            updateProfileSetting('readerMode', false);
            echoLocal('\x1b[32mReader mode disabled - speech plays immediately\x1b[0m');
          } else {
            echoLocal(`Reader mode is currently ${settings.readerMode ? 'on' : 'off'}`);
            echoLocal(`Usage: ${prefix}config reader on|off`);
          }
          return true;
          
        case 'keep':
          if (option === 'on') {
            updateProfileSetting('keepInputOnSend', true);
            echoLocal('\x1b[32mKeep input enabled - input will stay after pressing Enter\x1b[0m');
            echoLocal('\x1b[36mTip: Press Escape to clear the input line manually.\x1b[0m');
          } else if (option === 'off') {
            updateProfileSetting('keepInputOnSend', false);
            echoLocal('\x1b[32mKeep input disabled - input clears after pressing Enter\x1b[0m');
          } else {
            echoLocal(`Keep input is currently ${settings.keepInputOnSend ? 'on' : 'off'}`);
            echoLocal(`Usage: ${prefix}config keep on|off`);
            echoLocal('When on, the input line keeps your last command after pressing Enter.');
            echoLocal('Press Escape to clear the input line.');
          }
          return true;
          
        case 'prefix':
          if (option) {
            if (option.length === 1) {
              updateProfileSetting('commandPrefix', option);
              echoLocal(`\x1b[32mCommand prefix changed to "${option}"\x1b[0m`);
              echoLocal(`\x1b[36mNow use ${option}config to access configuration commands.\x1b[0m`);
            } else {
              echoLocal('\x1b[31mPrefix must be a single character.\x1b[0m');
            }
          } else {
            echoLocal(`Current command prefix: "${prefix}"`);
            echoLocal(`Usage: ${prefix}config prefix <character>`);
            echoLocal('Example: /config prefix # (then use #config speech on)');
          }
          return true;
          
        default:
          echoLocal(`\x1b[31mUnknown config option: ${feature}\x1b[0m`);
          echoLocal(`Type ${prefix}config for available options.`);
          return true;
      }
    }
    
    // Unknown command starting with prefix
    echoLocal(`\x1b[31mUnknown command: ${command}\x1b[0m`);
    echoLocal(`Type ${prefix}help for available commands.`);
    return true;
  }, [echoLocal, settings, updateProfileSetting, speak, cancelSpeech, voices, setSettingsOpen]);

  const variablesPersistTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const setVariable = useCallback((name: string, value: string | number | boolean | null) => {
    const currentProfileId = profile?.id;
    setVariables(prev => {
      const newVars = { ...prev, [name]: value };
      
      if (variablesPersistTimeoutRef.current) {
        clearTimeout(variablesPersistTimeoutRef.current);
      }
      variablesPersistTimeoutRef.current = setTimeout(() => {
        if (currentProfileId && profile?.id === currentProfileId) {
          updateProfile.mutate({ id: currentProfileId, variables: newVars });
        }
      }, 1000);
      
      return newVars;
    });
  }, [profile, updateProfile]);
  
  // Clear pending variable persistence on profile change
  useEffect(() => {
    if (variablesPersistTimeoutRef.current) {
      clearTimeout(variablesPersistTimeoutRef.current);
      variablesPersistTimeoutRef.current = null;
    }
  }, [profile?.id]);

  const getVariable = useCallback((name: string) => {
    return variables[name];
  }, [variables]);

  const playSound = useCallback((name: string, volume?: number, loop?: boolean) => {
    soundManager.resume();
    soundManager.play(name, volume ?? 1, loop ?? false);
  }, []);

  const stopSound = useCallback((name: string) => {
    soundManager.stop(name);
  }, []);

  const loopSound = useCallback((name: string, volume?: number) => {
    soundManager.resume();
    soundManager.loop(name, volume ?? 1);
  }, []);

  const setSoundPosition = useCallback((name: string, x: number, y: number, z?: number) => {
    soundManager.setPosition(name, x, y, z ?? 0);
  }, []);

  // Text manipulation callbacks
  const gagLine = useCallback(() => {
    lineModificationsRef.current.gagged = true;
  }, []);


  const replaceText = useCallback((oldText: string, newText: string) => {
    lineModificationsRef.current.replacements.push({ old: oldText, new: newText });
  }, []);

  // User-friendly helper callbacks
  const showNotification = useCallback((message: string, type?: 'info' | 'success' | 'warning' | 'danger') => {
    const variant = type === 'danger' ? 'destructive' : 'default';
    toast({
      title: type === 'danger' ? 'Alert' : type === 'warning' ? 'Warning' : type === 'success' ? 'Success' : 'Info',
      description: message,
      variant,
    });
  }, [toast]);

  const updateGauge = useCallback((name: string, current: number, max: number, color?: string) => {
    setGauges(prev => {
      const next = new Map(prev);
      next.set(name, { current, max, color });
      return next;
    });
  }, []);

  const removeGauge = useCallback((name: string) => {
    setGauges(prev => {
      const next = new Map(prev);
      next.delete(name);
      return next;
    });
  }, []);

  const addToLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    sessionLogRef.current.push(`[${timestamp}] ${message}`);
  }, []);

  const getSessionLog = useCallback((): string[] => {
    return [...sessionLogRef.current];
  }, []);

  const clearSessionLog = useCallback(() => {
    sessionLogRef.current = [];
  }, []);

  // Dynamic automation callbacks
  const createTempTrigger = useCallback((pattern: string, script: string, timeout?: number): string => {
    const id = `temp_trigger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    tempTriggersRef.current.push({
      id,
      pattern,
      script,
      timeout,
      createdAt: Date.now(),
    });
    
    // If timeout is specified, auto-remove after timeout
    if (timeout && timeout > 0) {
      setTimeout(() => {
        tempTriggersRef.current = tempTriggersRef.current.filter(t => t.id !== id);
      }, timeout * 1000);
    }
    
    return id;
  }, []);

  const createTempAlias = useCallback((pattern: string, script: string): string => {
    const id = `temp_alias_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    tempAliasesRef.current.push({ id, pattern, script });
    return id;
  }, []);

  const createTempTimer = useCallback((seconds: number, script: string): string => {
    const id = `temp_timer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timeoutId = setTimeout(async () => {
      tempTimersRef.current.delete(id);
      try {
        await executeLuaScript(script);
      } catch (err) {
        console.error('Temp timer script error:', err);
      }
    }, seconds * 1000);
    tempTimersRef.current.set(id, timeoutId);
    return id;
  }, []);

  const killTempTrigger = useCallback((id: string) => {
    tempTriggersRef.current = tempTriggersRef.current.filter(t => t.id !== id);
  }, []);

  const killTempAlias = useCallback((id: string) => {
    tempAliasesRef.current = tempAliasesRef.current.filter(a => a.id !== id);
  }, []);

  const killTempTimer = useCallback((id: string) => {
    const timeoutId = tempTimersRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      tempTimersRef.current.delete(id);
    }
  }, []);

  // Toggle functions for permanent automation
  const enableTriggerByName = useCallback((name: string) => {
    if (!profile) return;
    const updatedTriggers = triggers.map(t => 
      (t.pattern === name || t.id === name) ? { ...t, active: true } : t
    );
    updateProfile.mutate({ id: profile.id, triggers: updatedTriggers });
  }, [profile, triggers, updateProfile]);

  const disableTriggerByName = useCallback((name: string) => {
    if (!profile) return;
    const updatedTriggers = triggers.map(t => 
      (t.pattern === name || t.id === name) ? { ...t, active: false } : t
    );
    updateProfile.mutate({ id: profile.id, triggers: updatedTriggers });
  }, [profile, triggers, updateProfile]);

  const enableAliasByName = useCallback((name: string) => {
    if (!profile) return;
    const updatedAliases = aliases.map(a => 
      (a.pattern === name || a.id === name) ? { ...a, active: true } : a
    );
    updateProfile.mutate({ id: profile.id, aliases: updatedAliases });
  }, [profile, aliases, updateProfile]);

  const disableAliasByName = useCallback((name: string) => {
    if (!profile) return;
    const updatedAliases = aliases.map(a => 
      (a.pattern === name || a.id === name) ? { ...a, active: false } : a
    );
    updateProfile.mutate({ id: profile.id, aliases: updatedAliases });
  }, [profile, aliases, updateProfile]);

  const enableTimerByName = useCallback((name: string) => {
    if (!profile) return;
    const updatedTimers = timers.map(t => 
      t.id === name ? { ...t, active: true } : t
    );
    updateProfile.mutate({ id: profile.id, timers: updatedTimers });
  }, [profile, timers, updateProfile]);

  const disableTimerByName = useCallback((name: string) => {
    if (!profile) return;
    const updatedTimers = timers.map(t => 
      t.id === name ? { ...t, active: false } : t
    );
    updateProfile.mutate({ id: profile.id, timers: updatedTimers });
  }, [profile, timers, updateProfile]);

  const enableClassByName = useCallback((name: string) => {
    if (!profile) return;
    const updatedClasses = classes.map(c => 
      (c.name === name || c.id === name) ? { ...c, active: true } : c
    );
    updateProfile.mutate({ id: profile.id, classes: updatedClasses });
  }, [profile, classes, updateProfile]);

  const disableClassByName = useCallback((name: string) => {
    if (!profile) return;
    const updatedClasses = classes.map(c => 
      (c.name === name || c.id === name) ? { ...c, active: false } : c
    );
    updateProfile.mutate({ id: profile.id, classes: updatedClasses });
  }, [profile, classes, updateProfile]);

  // Fire trigger by name - allows trigger chaining (declared as ref to avoid circular deps)
  const fireTriggerByNameRef = useRef<(name: string, line?: string) => Promise<void>>();

  // Expand alias utility
  const expandAliasCommand = useCallback((command: string): string => {
    const result = processAlias(command, aliases, sendCommand, echoLocal);
    return result ?? command;
  }, [aliases, sendCommand, echoLocal]);

  const executeScript = useCallback(async (script: string, line?: string, matches?: string[], namedCaptures?: Record<string, string>, isPrompt?: boolean) => {
    try {
      setScriptContext({
        send: sendCommand,
        echo: echoLocal,
        setVariable,
        getVariable,
        playSound,
        stopSound,
        loopSound,
        setSoundPosition,
        line,
        matches,
        isPrompt: isPrompt ?? false,
        // Extended API
        gag: gagLine,
        replace: replaceText,
        tempTrigger: createTempTrigger,
        tempAlias: createTempAlias,
        tempTimer: createTempTimer,
        killTrigger: killTempTrigger,
        killAlias: killTempAlias,
        killTimer: killTempTimer,
        enableTrigger: enableTriggerByName,
        disableTrigger: disableTriggerByName,
        enableAlias: enableAliasByName,
        disableAlias: disableAliasByName,
        enableTimer: enableTimerByName,
        disableTimer: disableTimerByName,
        enableClass: enableClassByName,
        disableClass: disableClassByName,
        expandAlias: expandAliasCommand,
        fireTrigger: (name: string, line?: string) => fireTriggerByNameRef.current?.(name, line),
        // User-friendly helpers
        notify: showNotification,
        setGauge: updateGauge,
        clearGauge: removeGauge,
        log: addToLog,
        getLog: getSessionLog,
        clearLog: clearSessionLog,
      });
      await executeLuaScript(script, line, matches, namedCaptures);
    } catch (err) {
      console.error('Lua script execution error:', err);
      echoLocal(`[Script Error] ${err}`);
    }
  }, [
    sendCommand, echoLocal, setVariable, getVariable, playSound, stopSound, loopSound, setSoundPosition,
    gagLine, replaceText,
    createTempTrigger, createTempAlias, createTempTimer, killTempTrigger, killTempAlias, killTempTimer,
    enableTriggerByName, disableTriggerByName, enableAliasByName, disableAliasByName,
    enableTimerByName, disableTimerByName, enableClassByName, disableClassByName,
    expandAliasCommand, showNotification, updateGauge, removeGauge, addToLog, getSessionLog, clearSessionLog
  ]);

  const disableTimer = useCallback((timerId: string) => {
    if (!profile) return;
    const updatedTimers = timers.map(t => 
      t.id === timerId ? { ...t, active: false } : t
    );
    updateProfile.mutate({ id: profile.id, timers: updatedTimers });
  }, [profile, timers, updateProfile]);

  // Set up fireTriggerByName ref to avoid circular dependencies
  useEffect(() => {
    fireTriggerByNameRef.current = async (name: string, line?: string) => {
      const trigger = triggers.find(t => 
        (t.pattern === name || t.id === name) && t.active && isClassActive(t.classId)
      );
      if (!trigger) {
        console.warn(`Trigger not found or inactive: ${name}`);
        return;
      }
      
      const testLine = line ?? '';
      const cleanLine = stripAnsi(testLine);
      
      // Execute the trigger's script
      if (trigger.script) {
        let matches: string[] = [cleanLine];
        let namedCaptures: Record<string, string> = {};
        
        if (trigger.type === 'regex') {
          const re = new RegExp(trigger.pattern);
          const match = re.exec(cleanLine);
          if (match) {
            matches = Array.from(match);
            if (match.groups) {
              namedCaptures = { ...match.groups };
            }
          }
        }
        
        await executeScript(trigger.script, cleanLine, matches, namedCaptures);
      }
      
      // Play sound if configured
      if (trigger.soundFile) {
        playSound(trigger.soundFile, trigger.soundVolume, trigger.soundLoop);
      }
    };
  }, [triggers, isClassActive, executeScript, playSound]);

  useTimers({
    timers,
    onExecute: executeScript,
    onDisableTimer: disableTimer,
    isClassActive,
    enabled: isConnected,
  });

  useKeybindings({
    keybindings,
    onSend: sendCommand,
    onExecuteScript: executeScript,
    isClassActive,
    enabled: isConnected,
  });

  // Track if only Ctrl was pressed (no other keys)
  const ctrlOnlyRef = useRef(true);
  const lastCtrlTapRef = useRef<number>(0);

  // Fetch active soundpack
  const { data: activeSoundpack } = useQuery<SoundpackRow>({
    queryKey: ['/api/soundpacks', activeSoundpackId],
    enabled: !!activeSoundpackId,
  });

  // Initialize Lua engine and sound manager
  useEffect(() => {
    initLuaEngine().then(() => {
      console.log('Lua scripting engine ready');
    }).catch(err => {
      console.error('Failed to initialize Lua engine:', err);
    });
    
    soundManager.init().then(() => {
      console.log('Sound manager ready');
    });
    
    return () => {
      destroyLuaEngine();
      soundManager.stopAll();
      if (variablesPersistTimeoutRef.current) {
        clearTimeout(variablesPersistTimeoutRef.current);
      }
    };
  }, []);

  // Load soundpack when it changes
  useEffect(() => {
    if (activeSoundpack && activeSoundpack.files) {
      soundManager.setSoundpack(activeSoundpack.files);
      soundManager.preloadSoundpack(activeSoundpack.files).then(() => {
        console.log('Soundpack loaded:', activeSoundpack.name);
      });
    }
  }, [activeSoundpack]);

  // Global keyboard shortcuts (Ctrl+1-9 to read lines, double-tap Ctrl to toggle pause)
  useEffect(() => {
    const DOUBLE_TAP_THRESHOLD = 400; // ms between taps to count as double-tap
    
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // If Ctrl is pressed with any other key, mark that Ctrl wasn't alone
      if (e.ctrlKey && e.key !== 'Control') {
        ctrlOnlyRef.current = false;
      }

      // F1 opens help page
      if (e.key === 'F1') {
        e.preventDefault();
        navigate('/help');
        return;
      }

      // Ctrl + number keys (1-9) to read recent lines
      if (e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9) {
          e.preventDefault();
          const lineIndex = lines.length - num;
          if (lineIndex >= 0 && lines[lineIndex]) {
            const cleanLine = stripAnsi(lines[lineIndex]);
            speakLine(cleanLine);
          }
          return;
        }
      }
    };

    const handleGlobalKeyUp = (e: KeyboardEvent) => {
      // Double-tap Ctrl to toggle pause/resume speech
      // This avoids conflicts with screen reader modifiers (VO uses Ctrl+Option)
      if (e.key === 'Control') {
        if (ctrlOnlyRef.current) {
          const now = Date.now();
          if (now - lastCtrlTapRef.current < DOUBLE_TAP_THRESHOLD) {
            togglePause();
            lastCtrlTapRef.current = 0; // Reset to prevent triple-tap
          } else {
            lastCtrlTapRef.current = now;
          }
        }
        // Reset for next Ctrl press
        ctrlOnlyRef.current = true;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('keyup', handleGlobalKeyUp);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('keyup', handleGlobalKeyUp);
    };
  }, [lines, speakLine, togglePause, navigate]);

  // Connect to WebSocket for active connection
  useEffect(() => {
    if (!profile || !activeConnectionId) return;
    
    // Check if this connection already has a socket
    const conn = connections.find(c => c.id === activeConnectionId);
    if (conn?.socket) return; // Already connected

    // Build WS URL (uses same host as frontend, just wss protocol)
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const currentConnId = activeConnectionId;
    const ws = new WebSocket(wsUrl);
    
    // Store socket in connection state (not in ref since we use connection-aware getActiveSocket)
    updateConnectionState(currentConnId, { socket: ws });

    ws.onopen = () => {
      updateConnectionState(currentConnId, { isConnected: true });
      // Send connect handshake
      const msg: WsClientMessage = {
        type: "connect",
        host: profile.host,
        port: profile.port,
        encoding: profile.encoding || "ISO-8859-1",
        gmcp: settings.gmcpEnabled !== false
      };
      ws.send(JSON.stringify(msg));
      addLinesToConnection(currentConnId, [`\x1b[32m>> Connected to Relay Server. Connecting to ${profile.host}:${profile.port}...\x1b[0m`]);
    };

    ws.onclose = () => {
      updateConnectionState(currentConnId, { isConnected: false, socket: null });
      addLinesToConnection(currentConnId, [`\x1b[31m>> Disconnected from Relay Server.\x1b[0m`]);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WsServerMessage;
        
        if (msg.type === 'data') {
          // Process MSP sound triggers
          const processedContent = processLineForMSP(msg.content);
          
          // Speak if enabled
          if (settings.speechEnabled) {
            // Interrupt existing speech if enabled
            if (settings.interruptOnIncoming) {
              cancelSpeech();
            }
            const cleanText = stripAnsi(processedContent);
            speak(cleanText);
          }

          // Reset line modifications for this trigger run
          lineModificationsRef.current = { gagged: false, replacements: [] };
          
          // Run triggers (if enabled)
          const cleanLine = stripAnsi(processedContent);
          let displayLine = processedContent;
          
          // Update line buffer for multi-line triggers
          lineBufferRef.current.push(cleanLine);
          if (lineBufferRef.current.length > MAX_LINE_BUFFER) {
            lineBufferRef.current = lineBufferRef.current.slice(-MAX_LINE_BUFFER);
          }
          
          // Check for prompt pattern match
          let isPromptLine = false;
          if (profileSettings.promptPattern) {
            try {
              const promptRe = new RegExp(profileSettings.promptPattern);
              isPromptLine = promptRe.test(cleanLine);
            } catch {
              // Invalid regex, ignore
            }
          }
          
          if (settings.triggersEnabled !== false) {
            // Process permanent triggers
            for (const trigger of triggers) {
              if (!trigger.active || !isClassActive(trigger.classId)) continue;
              
              let matches: string[] | null = null;
              let namedCaptures: Record<string, string> = {};
              
              // Handle multi-line triggers
              if (trigger.multiLine && trigger.lineCount && trigger.lineCount > 1) {
                const numLines = Math.min(trigger.lineCount, lineBufferRef.current.length);
                if (numLines >= trigger.lineCount) {
                  const delimiter = trigger.lineDelimiter ?? '\n';
                  const combinedLines = lineBufferRef.current.slice(-numLines).join(delimiter);
                  
                  if (trigger.type === 'regex') {
                    const re = new RegExp(trigger.pattern, 's'); // 's' flag for dotall mode
                    const match = re.exec(combinedLines);
                    if (match) {
                      matches = Array.from(match);
                      if (match.groups) {
                        namedCaptures = { ...match.groups };
                      }
                    }
                  } else {
                    if (combinedLines.includes(trigger.pattern)) {
                      matches = [trigger.pattern];
                    }
                  }
                }
              } else {
                // Single-line trigger (original logic)
                if (trigger.type === 'regex') {
                  const re = new RegExp(trigger.pattern);
                  const match = re.exec(cleanLine);
                  if (match) {
                    matches = Array.from(match);
                    if (match.groups) {
                      namedCaptures = { ...match.groups };
                    }
                  }
                } else {
                  if (cleanLine.includes(trigger.pattern)) {
                    matches = [trigger.pattern];
                  }
                }
              }
              
              if (matches) {
                // Handle gag flag (no script needed)
                if (trigger.gag) {
                  lineModificationsRef.current.gagged = true;
                }
                
                // Execute script if present
                if (trigger.script) {
                  const matchLine = trigger.multiLine 
                    ? lineBufferRef.current.slice(-(trigger.lineCount || 1)).join(trigger.lineDelimiter ?? '\n')
                    : cleanLine;
                  executeScript(trigger.script, matchLine, matches, namedCaptures, isPromptLine);
                }
                
                if (trigger.soundFile) {
                  playSound(trigger.soundFile, trigger.soundVolume, trigger.soundLoop);
                }
              }
            }
            
            // Process temporary triggers (support both regex and plain text)
            const tempTriggersCopy = [...tempTriggersRef.current];
            for (const tempTrigger of tempTriggersCopy) {
              try {
                let matches: string[] | null = null;
                let namedCaptures: Record<string, string> = {};
                
                // Try regex first, fall back to plain text substring match
                try {
                  const re = new RegExp(tempTrigger.pattern);
                  const match = re.exec(cleanLine);
                  if (match) {
                    matches = Array.from(match);
                    if (match.groups) {
                      namedCaptures = { ...match.groups };
                    }
                  }
                } catch {
                  // If pattern is not valid regex, use substring match
                  if (cleanLine.includes(tempTrigger.pattern)) {
                    matches = [tempTrigger.pattern];
                  }
                }
                
                if (matches) {
                  executeScript(tempTrigger.script, cleanLine, matches, namedCaptures);
                  // Temp triggers fire once then are removed
                  tempTriggersRef.current = tempTriggersRef.current.filter(t => t.id !== tempTrigger.id);
                }
              } catch (err) {
                console.error('Temp trigger error:', err);
              }
            }
          }
          
          // Apply line modifications (replace)
          for (const replacement of lineModificationsRef.current.replacements) {
            displayLine = displayLine.replace(replacement.old, replacement.new);
          }
          
          // Add line to display (unless gagged)
          if (!lineModificationsRef.current.gagged) {
            addLinesToConnection(currentConnId, [displayLine]);
          }
        } else if (msg.type === 'connected') {
          addLinesToConnection(currentConnId, [`\x1b[32m>> Connected to MUD.\x1b[0m`]);
          
          // Send login commands if configured
          if (profile.loginCommands) {
            const commands = profile.loginCommands.split('\n').filter(c => c.trim());
            commands.forEach((cmd, index) => {
              let processedCmd = cmd
                .replace(/\{name\}/gi, profile.characterName || '')
                .replace(/\{password\}/gi, profile.characterPassword || '');
              
              // Delay each command slightly to ensure they arrive in order
              setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ type: 'send', data: processedCmd }));
                }
              }, index * 200);
            });
          }
        } else if (msg.type === 'disconnected') {
          addLinesToConnection(currentConnId, [`\x1b[31m>> Disconnected from MUD: ${msg.reason}\x1b[0m`]);
        } else if (msg.type === 'error') {
          addLinesToConnection(currentConnId, [`\x1b[31m>> Error: ${msg.message}\x1b[0m`]);
          toast({ variant: "destructive", title: "Connection Error", description: msg.message });
        } else if (msg.type === 'gmcp') {
          console.log('GMCP:', msg.module, msg.data);
          setGmcpData(prev => ({ ...prev, [msg.module]: msg.data }));
          
          if (msg.module === 'Char.Vitals' && typeof msg.data === 'object' && msg.data !== null) {
            const vitals = msg.data as Record<string, unknown>;
            const vitalStr = Object.entries(vitals)
              .map(([k, v]) => `${k}: ${v}`)
              .join(' | ');
            addLinesToConnection(currentConnId, [`\x1b[35m[Vitals] ${vitalStr}\x1b[0m`]);
          } else if (msg.module === 'Room.Info' && typeof msg.data === 'object' && msg.data !== null) {
            const room = msg.data as Record<string, unknown>;
            const roomName = room.name || room.short || 'Unknown Room';
            const exits = Array.isArray(room.exits) ? room.exits.join(', ') : 
                          (typeof room.exits === 'object' && room.exits !== null) ? Object.keys(room.exits).join(', ') : '';
            const roomLine = exits ? `[Room] ${roomName} | Exits: ${exits}` : `[Room] ${roomName}`;
            addLinesToConnection(currentConnId, [`\x1b[36m${roomLine}\x1b[0m`]);
          } else if (msg.module.startsWith('Core.')) {
            console.log('GMCP Core module:', msg.module, msg.data);
          }
        }
      } catch (e) {
        console.error("Failed to parse WS message", e);
      }
    };

    return () => {
      ws.close();
    };
  }, [profile, activeConnectionId, connections, updateConnectionState, addLinesToConnection, toast, speak, cancelSpeech, settings.speechEnabled, settings.interruptOnIncoming, triggers, sendCommand, echoLocal]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    // Interrupt speech on send if enabled
    if (settings.interruptOnSend !== false) {
      cancelSpeech();
    }
    
    // Check for client-side commands (start with /)
    if (inputValue.startsWith('/')) {
      const handled = handleClientCommand(inputValue);
      if (handled) {
        setCommandHistory(prev => [inputValue, ...prev.filter(c => c !== inputValue)].slice(0, 50));
        setHistoryIndex(-1);
        if (!settings.keepInputOnSend) {
          setInputValue("");
        }
        return;
      }
    }
    
    // Need connection for MUD commands
    const socket = getActiveSocket();
    if (!socket) return;

    // Process aliases first (if enabled)
    let commandToSend = inputValue;
    
    if (settings.aliasesEnabled !== false) {
      let aliasMatched = false;
      
      // Process permanent aliases
      for (const alias of aliases) {
        if (!alias.active || !isClassActive(alias.classId)) continue;
        
        const re = new RegExp(alias.pattern);
        const match = re.exec(inputValue);
        
        if (match) {
          aliasMatched = true;
          if (alias.isScript) {
            await executeScript(alias.command, inputValue, Array.from(match));
            commandToSend = '';
          } else {
            commandToSend = alias.command;
            for (let i = 1; i < match.length; i++) {
              commandToSend = commandToSend.replace(new RegExp(`\\$${i}`, 'g'), match[i] || '');
            }
          }
          break;
        }
      }
      
      // Process temporary aliases if no permanent alias matched
      if (!aliasMatched) {
        const tempAliasesCopy = [...tempAliasesRef.current];
        for (const tempAlias of tempAliasesCopy) {
          try {
            const re = new RegExp(tempAlias.pattern);
            const match = re.exec(inputValue);
            
            if (match) {
              await executeScript(tempAlias.script, inputValue, Array.from(match));
              commandToSend = '';
              // Temp aliases remain active until killed
              break;
            }
          } catch (err) {
            console.error('Temp alias error:', err);
          }
        }
      }
    }

    // Send to server (if there's still a command after alias processing)
    if (commandToSend && socket.readyState === WebSocket.OPEN) {
      const msg: WsClientMessage = { type: 'send', data: commandToSend };
      socket.send(JSON.stringify(msg));
    }

    // Echo locally (if enabled)
    if (settings.showInputEcho !== false && activeConnectionId) {
      addLinesToConnection(activeConnectionId, [`\x1b[36m${inputValue}\x1b[0m`]);
    }
    
    // History
    setCommandHistory(prev => [inputValue, ...prev.filter(c => c !== inputValue)].slice(0, 50));
    setHistoryIndex(-1);
    
    // Clear input unless keepInputOnSend is enabled
    if (!settings.keepInputOnSend) {
      setInputValue("");
    }
    
    // Force scroll to bottom on send
    setIsAutoScroll(true);
    virtuosoRef.current?.scrollToIndex({ index: lines.length + 1, align: 'end' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Interrupt speech on keypress if enabled (but not for modifier keys alone)
    if (settings.interruptOnKeypress && 
        !['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Escape'].includes(e.key)) {
      cancelSpeech();
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
        setHistoryIndex(nextIndex);
        setInputValue(commandHistory[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInputValue(commandHistory[nextIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputValue("");
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setInputValue("");
      setHistoryIndex(-1);
    }
  };

  const scrollToBottom = useCallback(() => {
    virtuosoRef.current?.scrollToIndex({ index: lines.length - 1, align: "end", behavior: "smooth" });
    setIsAutoScroll(true);
  }, [lines.length]);

  const handleDisconnect = useCallback(() => {
    if (activeConnectionId) {
      const conn = connections.find(c => c.id === activeConnectionId);
      if (conn?.socket) {
        conn.socket.close();
        updateConnectionState(activeConnectionId, { socket: null, isConnected: false });
        addLinesToConnection(activeConnectionId, [`\x1b[33m>> Disconnected by user.\x1b[0m`]);
        toast({ title: "Disconnected", description: `Closed connection to ${profile?.host}` });
      }
    }
  }, [activeConnectionId, connections, updateConnectionState, addLinesToConnection, profile, toast]);

  if (!profile && !initialProfile) return <div className="p-8 text-primary">Loading profile...</div>;
  if (!profile) return <div className="p-8 text-primary">Loading connection...</div>;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden relative">
      {/* Connection Tabs - Show when multiple connections */}
      {connections.length > 1 && (
        <ConnectionTabs
          tabs={connectionTabs}
          activeTabId={activeConnectionId}
          onSelectTab={setActiveConnectionId}
          onCloseTab={closeConnection}
          onAddTab={() => setAddConnectionOpen(true)}
        />
      )}
      
      {/* Add Connection Dialog */}
      <AddConnectionDialog
        open={addConnectionOpen}
        onOpenChange={setAddConnectionOpen}
        onSelectProfile={addConnection}
        existingProfileIds={connections.map(c => c.profileId)}
      />
      
      {/* Top Bar */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-card/50">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-library">
              <Library className="w-4 h-4 mr-2" />
              Library
            </Button>
          </Link>
          {connections.length === 1 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setAddConnectionOpen(true)}
              data-testid="button-add-connection"
            >
              <span className="mr-1">+</span> Add MUD
            </Button>
          )}
          <h2 className="font-bold text-primary tracking-wider">{profile.name}</h2>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3 text-green-500" /> ONLINE
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleDisconnect}
                  className="text-xs h-6 px-2"
                  data-testid="button-disconnect"
                >
                  <Unplug className="w-3 h-3 mr-1" />
                  Disconnect
                </Button>
              </>
            ) : (
              <><WifiOff className="w-3 h-3 text-red-500" /> OFFLINE</>
            )}
            <span>{profile.host}:{profile.port}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <VariablesPanel 
            variables={variables}
            onUpdate={(vars) => {
              setVariables(vars);
              if (profile) {
                updateProfile.mutate({ id: profile.id, variables: vars });
              }
            }}
          />
          <ClassesPanel 
            classes={classes}
            onUpdate={(cls) => {
              if (profile) {
                updateProfile.mutate({ id: profile.id, classes: cls });
              }
            }}
          />
          <SoundpackPanel 
            activeSoundpackId={activeSoundpackId}
            onSelectSoundpack={(id) => {
              if (profile) {
                updateProfile.mutate({ id: profile.id, activeSoundpackId: id });
              }
            }}
          />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setTriggersOpen(true)}
            aria-label="Triggers"
            data-testid="button-triggers"
          >
            <Zap className="w-4 h-4" />
            <span className="sr-only">Triggers</span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setAliasesOpen(true)}
            aria-label="Aliases"
            data-testid="button-aliases"
          >
            <Terminal className="w-4 h-4" />
            <span className="sr-only">Aliases</span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setTimersOpen(true)}
            aria-label="Timers"
            data-testid="button-timers"
          >
            <Clock className="w-4 h-4" />
            <span className="sr-only">Timers</span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setKeybindingsOpen(true)}
            aria-label="Keybindings"
            data-testid="button-keybindings"
          >
            <Keyboard className="w-4 h-4" />
            <span className="sr-only">Keybindings</span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setButtonsOpen(true)}
            aria-label="Buttons"
            data-testid="button-buttons"
          >
            <SquareMousePointer className="w-4 h-4" />
            <span className="sr-only">Buttons</span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setPackagesOpen(true)}
            aria-label="Packages"
            data-testid="button-packages"
          >
            <Package className="w-4 h-4" />
            <span className="sr-only">Packages</span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setScriptAssistantOpen(true)}
            aria-label="Script Assistant"
            data-testid="button-script-assistant"
          >
            <Wand2 className="w-4 h-4" />
            <span className="sr-only">Script Assistant</span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
            data-testid="button-settings"
          >
            <Settings className="w-4 h-4" />
            <span className="sr-only">Settings</span>
          </Button>
        </div>
      </div>

      {/* Gauges Display */}
      {gauges.size > 0 && (
        <div className="px-4 py-2 bg-card/50 border-b border-border flex flex-wrap gap-3" data-testid="gauges-container">
          {Array.from(gauges.entries()).map(([name, gauge]) => {
            const percent = Math.min(100, Math.max(0, (gauge.current / gauge.max) * 100));
            const color = gauge.color || (percent < 25 ? 'red' : percent < 50 ? 'yellow' : 'green');
            return (
              <div key={name} className="flex items-center gap-2 min-w-[150px]" data-testid={`gauge-${name}`}>
                <span className="text-xs text-muted-foreground capitalize">{name}:</span>
                <div className="flex-1 h-3 bg-muted rounded-sm overflow-hidden relative">
                  <div 
                    className="h-full transition-all duration-300"
                    style={{ 
                      width: `${percent}%`,
                      backgroundColor: color === 'red' ? '#ef4444' : color === 'yellow' ? '#eab308' : color === 'green' ? '#22c55e' : color === 'blue' ? '#3b82f6' : color
                    }}
                  />
                </div>
                <span className="text-xs font-mono">{gauge.current}/{gauge.max}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Terminal Area */}
      <div 
        className="flex-1 overflow-hidden relative" 
        style={{ 
          fontSize: `${(settings.fontScale || 1)}rem`,
          lineHeight: settings.lineHeight || 1.4,
        }}
      >
        <div className="absolute inset-0 scanlines opacity-10 pointer-events-none z-10" />
        
        <Virtuoso
          ref={virtuosoRef}
          data={lines}
          followOutput={isAutoScroll ? "smooth" : false}
          atBottomStateChange={(atBottom) => setIsAutoScroll(atBottom)}
          itemContent={(index, line) => (
            <TerminalLine 
              content={line} 
              stripSymbols={settings.stripSymbols}
              className={clsx(
                "px-4 py-0.5",
                settings.highContrast && "bg-black text-white"
              )} 
            />
          )}
          className="h-full scrollbar-thin"
        />

        {/* Scroll to bottom button if user scrolled up */}
        {!isAutoScroll && (
          <Button
            size="sm"
            className="absolute bottom-4 right-8 rounded-full shadow-xl bg-primary text-primary-foreground hover:bg-primary/90 z-20 animate-in fade-in zoom-in"
            onClick={scrollToBottom}
          >
            <ArrowDown className="w-4 h-4 mr-2" />
            Jump to Present
          </Button>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-card border-t border-border">
        <form onSubmit={handleSend} className="relative flex gap-2 max-w-5xl mx-auto">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-mono select-none">
            {">"}
          </div>
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-8 font-mono bg-background/50 border-primary/20 focus-visible:ring-primary focus-visible:border-primary"
            autoFocus
            placeholder="Enter command..."
            autoComplete="off"
            spellCheck={false}
          />
          <Button type="submit" className="font-bold">SEND</Button>
        </form>
      </div>

      <SettingsPanel 
        profile={profile} 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen} 
      />

      <TimersPanel 
        profile={profile} 
        open={timersOpen} 
        onOpenChange={setTimersOpen} 
      />

      <KeybindingsPanel 
        profile={profile} 
        open={keybindingsOpen} 
        onOpenChange={setKeybindingsOpen} 
      />

      <TriggersPanel 
        profile={profile} 
        open={triggersOpen} 
        onOpenChange={setTriggersOpen} 
      />

      <AliasesPanel 
        profile={profile} 
        open={aliasesOpen} 
        onOpenChange={setAliasesOpen} 
      />

      <ButtonsPanel 
        profile={profile} 
        open={buttonsOpen} 
        onOpenChange={setButtonsOpen} 
      />

      <PackageManager 
        profile={profile} 
        open={packagesOpen} 
        onOpenChange={setPackagesOpen} 
      />

      <ScriptAssistant
        open={scriptAssistantOpen}
        onOpenChange={setScriptAssistantOpen}
        onCreateTrigger={(trigger) => {
          if (!profile) return;
          const newTriggers = [...triggers, trigger as MudTrigger];
          updateProfile.mutate({ id: profile.id, triggers: newTriggers });
        }}
        onCreateAlias={(alias) => {
          if (!profile) return;
          const newAliases = [...aliases, alias as MudAlias];
          updateProfile.mutate({ id: profile.id, aliases: newAliases });
        }}
        onCreateTimer={(timer) => {
          if (!profile) return;
          const newTimers = [...timers, timer as MudTimer];
          updateProfile.mutate({ id: profile.id, timers: newTimers });
        }}
        onCreateKeybinding={(keybinding) => {
          if (!profile) return;
          const newKeybindings = [...keybindings, keybinding as MudKeybinding];
          updateProfile.mutate({ id: profile.id, keybindings: newKeybindings });
        }}
        onCreateButton={(button) => {
          if (!profile) return;
          const buttons = (profile.buttons || []) as MudButton[];
          const newButtons = [...buttons, button as MudButton];
          updateProfile.mutate({ id: profile.id, buttons: newButtons });
        }}
      />
    </div>
  );
}
