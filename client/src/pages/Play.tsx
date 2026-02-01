import { useEffect, useRef, useState, useCallback } from "react";
import { useRoute } from "wouter";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Wifi, WifiOff, ArrowDown, Clock, Keyboard, Volume2, Zap, Terminal, SquareMousePointer, Package, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WsClientMessage, WsServerMessage, GlobalSettings, ProfileSettings, MudTrigger, MudAlias, MudTimer, MudKeybinding, MudButton, MudClass, MudVariables, SoundpackRow, mergeSettings, DEFAULT_GLOBAL_SETTINGS } from "@shared/schema";
import { clsx } from "clsx";
import { useSpeech } from "@/hooks/use-speech";
import { processTriggers, processAlias } from "@/lib/scripting";
import { initLuaEngine, setScriptContext, executeLuaScript, destroyLuaEngine } from "@/lib/lua-scripting";
import { soundManager } from "@/lib/sound-manager";
import { processLineForMSP } from "@/lib/msp-parser";
import { useTimers } from "@/hooks/use-timers";
import { useKeybindings } from "@/hooks/use-keybindings";

// Hardcoded maximum lines to keep in buffer to prevent memory leaks
const MAX_LINES = 5000;

// Strip ANSI codes for speech
function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, "").trim();
}

export default function Play() {
  const [, params] = useRoute("/play/:id");
  const profileId = parseInt(params?.id || "0");
  const { data: profile } = useProfile(profileId);
  const { toast } = useToast();
  
  // Terminal State
  const [lines, setLines] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
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
  const socketRef = useRef<WebSocket | null>(null);
  const virtuosoRef = useRef<VirtuosoHandle>(null);
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
  
  const isClassActive = useCallback((classId?: string) => {
    if (!classId) return true;
    const cls = classes.find(c => c.id === classId);
    return cls ? cls.active : true;
  }, [classes]);
  
  const { speak, speakLine, cancel: cancelSpeech, togglePause, paused } = useSpeech({
    enabled: settings.speechEnabled ?? false,
    rate: settings.speechRate ?? 1,
    volume: settings.speechVolume ?? 1,
    pitch: settings.speechPitch ?? 1,
    voiceURI: settings.speechVoice ?? undefined,
  });

  // Scripting helpers
  const sendCommand = useCallback((cmd: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const msg: WsClientMessage = { type: 'send', data: cmd };
      socketRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const echoLocal = useCallback((text: string) => {
    setLines(prev => [...prev, `\x1b[33m${text}\x1b[0m`]);
  }, []);

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

  const executeScript = useCallback(async (script: string, line?: string, matches?: string[]) => {
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
      });
      await executeLuaScript(script, line, matches);
    } catch (err) {
      console.error('Lua script execution error:', err);
      echoLocal(`[Script Error] ${err}`);
    }
  }, [sendCommand, echoLocal, setVariable, getVariable, playSound, stopSound, loopSound, setSoundPosition]);

  const disableTimer = useCallback((timerId: string) => {
    if (!profile) return;
    const updatedTimers = timers.map(t => 
      t.id === timerId ? { ...t, active: false } : t
    );
    updateProfile.mutate({ id: profile.id, timers: updatedTimers });
  }, [profile, timers, updateProfile]);

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

  // Global keyboard shortcuts (Ctrl+1-9 to read lines, Ctrl alone to toggle pause)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // If Ctrl is pressed with any other key, mark that Ctrl wasn't alone
      if (e.ctrlKey && e.key !== 'Control') {
        ctrlOnlyRef.current = false;
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
      // Single Ctrl key press (without other keys) toggles pause
      if (e.key === 'Control') {
        if (ctrlOnlyRef.current) {
          togglePause();
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
  }, [lines, speakLine, togglePause]);

  // Connect to WebSocket
  useEffect(() => {
    if (!profile) return;

    // Build WS URL (uses same host as frontend, just wss protocol)
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Send connect handshake
      const msg: WsClientMessage = {
        type: "connect",
        host: profile.host,
        port: profile.port,
        encoding: profile.encoding || "ISO-8859-1",
        gmcp: settings.gmcpEnabled !== false
      };
      ws.send(JSON.stringify(msg));
      setLines(prev => [...prev, `\x1b[32m>> Connected to Relay Server. Connecting to ${profile.host}:${profile.port}...\x1b[0m`]);
    };

    ws.onclose = () => {
      setIsConnected(false);
      setLines(prev => [...prev, `\x1b[31m>> Disconnected from Relay Server.\x1b[0m`]);
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

          // Run triggers (if enabled)
          if (triggers.length > 0 && settings.triggersEnabled !== false) {
            const cleanLine = stripAnsi(processedContent);
            for (const trigger of triggers) {
              if (!trigger.active || !isClassActive(trigger.classId)) continue;
              
              let matches: string[] | null = null;
              if (trigger.type === 'regex') {
                const re = new RegExp(trigger.pattern);
                const match = re.exec(cleanLine);
                if (match) matches = Array.from(match);
              } else {
                if (cleanLine.includes(trigger.pattern)) {
                  matches = [trigger.pattern];
                }
              }
              
              if (matches && trigger.script) {
                executeScript(trigger.script, cleanLine, matches);
                if (trigger.soundFile) {
                  playSound(trigger.soundFile, trigger.soundVolume, trigger.soundLoop);
                }
              }
            }
          }

          setLines(prev => {
            const next = [...prev, processedContent];
            if (next.length > MAX_LINES) return next.slice(next.length - MAX_LINES);
            return next;
          });
        } else if (msg.type === 'connected') {
          setLines(prev => [...prev, `\x1b[32m>> Connected to MUD.\x1b[0m`]);
          
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
          setLines(prev => [...prev, `\x1b[31m>> Disconnected from MUD: ${msg.reason}\x1b[0m`]);
        } else if (msg.type === 'error') {
          setLines(prev => [...prev, `\x1b[31m>> Error: ${msg.message}\x1b[0m`]);
          toast({ variant: "destructive", title: "Connection Error", description: msg.message });
        } else if (msg.type === 'gmcp') {
          console.log('GMCP:', msg.module, msg.data);
          setGmcpData(prev => ({ ...prev, [msg.module]: msg.data }));
          
          if (msg.module === 'Char.Vitals' && typeof msg.data === 'object' && msg.data !== null) {
            const vitals = msg.data as Record<string, unknown>;
            const vitalStr = Object.entries(vitals)
              .map(([k, v]) => `${k}: ${v}`)
              .join(' | ');
            setLines(prev => [...prev, `\x1b[35m[Vitals] ${vitalStr}\x1b[0m`]);
          } else if (msg.module === 'Room.Info' && typeof msg.data === 'object' && msg.data !== null) {
            const room = msg.data as Record<string, unknown>;
            const roomName = room.name || room.short || 'Unknown Room';
            const exits = Array.isArray(room.exits) ? room.exits.join(', ') : 
                          (typeof room.exits === 'object' && room.exits !== null) ? Object.keys(room.exits).join(', ') : '';
            const roomLine = exits ? `[Room] ${roomName} | Exits: ${exits}` : `[Room] ${roomName}`;
            setLines(prev => [...prev, `\x1b[36m${roomLine}\x1b[0m`]);
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
  }, [profile, toast, speak, cancelSpeech, settings.speechEnabled, settings.interruptOnIncoming, triggers, sendCommand, echoLocal]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || !socketRef.current) return;

    // Interrupt speech on send if enabled
    if (settings.interruptOnSend !== false) {
      cancelSpeech();
    }

    // Process aliases first (if enabled)
    let commandToSend = inputValue;
    
    if (settings.aliasesEnabled !== false) {
      for (const alias of aliases) {
        if (!alias.active || !isClassActive(alias.classId)) continue;
        
        const re = new RegExp(alias.pattern);
        const match = re.exec(inputValue);
        
        if (match) {
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
    }

    // Send to server (if there's still a command after alias processing)
    if (commandToSend) {
      const msg: WsClientMessage = { type: 'send', data: commandToSend };
      socketRef.current.send(JSON.stringify(msg));
    }

    // Echo locally (if enabled)
    if (settings.showInputEcho !== false) {
      setLines(prev => [...prev, `\x1b[36m${inputValue}\x1b[0m`]);
    }
    
    // History
    setCommandHistory(prev => [inputValue, ...prev.filter(c => c !== inputValue)].slice(0, 50));
    setHistoryIndex(-1);
    
    setInputValue("");
    
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
    }
  };

  const scrollToBottom = useCallback(() => {
    virtuosoRef.current?.scrollToIndex({ index: lines.length - 1, align: "end", behavior: "smooth" });
    setIsAutoScroll(true);
  }, [lines.length]);

  if (!profile) return <div className="p-8 text-primary">Loading profile...</div>;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden relative">
      {/* Top Bar */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-card/50">
        <div className="flex items-center gap-4">
          <h2 className="font-bold text-primary tracking-wider">{profile.name}</h2>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            {isConnected ? (
              <><Wifi className="w-3 h-3 text-green-500" /> ONLINE</>
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
