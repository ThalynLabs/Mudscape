import { useEffect, useRef, useState, useCallback } from "react";
import { useRoute } from "wouter";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import { useProfile } from "@/hooks/use-profiles";
import { TerminalLine } from "@/components/TerminalLine";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Wifi, WifiOff, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WsClientMessage, WsServerMessage, ProfileSettings } from "@shared/schema";
import { clsx } from "clsx";
import { useSpeech } from "@/hooks/use-speech";

// Hardcoded maximum lines to keep in buffer to prevent memory leaks
const MAX_LINES = 5000;

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

  // Refs
  const socketRef = useRef<WebSocket | null>(null);
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Derived settings
  const settings = (profile?.settings || {}) as ProfileSettings;
  const { speak } = useSpeech({
    enabled: settings.speechEnabled ?? false,
    rate: settings.speechRate,
    voiceURI: settings.speechVoice,
  });

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
        encoding: profile.encoding || "ISO-8859-1"
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
          // Speak if enabled
          if (settings.speechEnabled) {
            // Very basic strip ANSI for speech
            // Real implementation would be more robust
            const cleanText = msg.content.replace(/\x1b\[[0-9;]*m/g, ""); 
            speak(cleanText);
          }

          setLines(prev => {
            const next = [...prev, msg.content];
            if (next.length > MAX_LINES) return next.slice(next.length - MAX_LINES);
            return next;
          });
        } else if (msg.type === 'connected') {
          setLines(prev => [...prev, `\x1b[32m>> Connected to MUD.\x1b[0m`]);
        } else if (msg.type === 'disconnected') {
          setLines(prev => [...prev, `\x1b[31m>> Disconnected from MUD: ${msg.reason}\x1b[0m`]);
        } else if (msg.type === 'error') {
          setLines(prev => [...prev, `\x1b[31m>> Error: ${msg.message}\x1b[0m`]);
          toast({ variant: "destructive", title: "Connection Error", description: msg.message });
        }
      } catch (e) {
        console.error("Failed to parse WS message", e);
      }
    };

    return () => {
      ws.close();
    };
  }, [profile, toast, speak, settings.speechEnabled]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || !socketRef.current) return;

    // Send to server
    const msg: WsClientMessage = { type: 'send', data: inputValue + '\r\n' };
    socketRef.current.send(JSON.stringify(msg));

    // Echo locally
    setLines(prev => [...prev, `\x1b[36m${inputValue}\x1b[0m`]);
    
    // History
    setCommandHistory(prev => [inputValue, ...prev.filter(c => c !== inputValue)].slice(0, 50));
    setHistoryIndex(-1);
    
    setInputValue("");
    
    // Force scroll to bottom on send
    setIsAutoScroll(true);
    virtuosoRef.current?.scrollToIndex({ index: lines.length + 1, align: 'end' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
        <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Terminal Area */}
      <div 
        className="flex-1 overflow-hidden relative" 
        style={{ 
          fontSize: `${(settings.fontScale || 1)}rem` 
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
    </div>
  );
}
