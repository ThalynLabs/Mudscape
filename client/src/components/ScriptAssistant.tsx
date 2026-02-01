import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wand2, Send, Loader2, Copy, Check, Plus, Code, Zap, Timer, Keyboard, SquareMousePointer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MudTrigger, MudAlias, MudTimer, MudKeybinding, MudButton } from '@shared/schema';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  codeBlocks?: { type: 'trigger' | 'alias' | 'timer' | 'keybinding' | 'button' | 'lua'; code: string; name?: string; pattern?: string }[];
}

interface ScriptAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTrigger?: (trigger: Partial<MudTrigger>) => void;
  onCreateAlias?: (alias: Partial<MudAlias>) => void;
  onCreateTimer?: (timer: Partial<MudTimer>) => void;
  onCreateKeybinding?: (keybinding: Partial<MudKeybinding>) => void;
  onCreateButton?: (button: Partial<MudButton>) => void;
}

const SYSTEM_PROMPT = `You are an expert MUD (Multi-User Dungeon) scripting assistant for Mudscape, an accessibility-first MUD client. You help users create Lua scripts for triggers, aliases, timers, keybindings, and buttons.

## Available Lua API Functions:
- send(command) - Send a command to the MUD server
- echo(text) - Display text locally in the terminal (yellow)
- setVariable(name, value) - Store a persistent variable
- getVariable(name) - Retrieve a stored variable
- playSound(name, volume, loop) - Play a sound from the active soundpack (name is filename without extension, volume 0-100, loop true/false)
- stopSound(name) - Stop a playing sound
- loopSound(name, volume) - Start looping a sound continuously
- setSoundPosition(name, x, y, z) - Set 3D position for spatial audio (HRTF)

## Built-in Variables (in triggers):
- line - The full matched line from the MUD
- matches - Table of regex capture groups (matches[0] = full match, matches[1] = first group, etc.)

## Script Types:
1. **Triggers** - Run when incoming MUD text matches a pattern (regex)
2. **Aliases** - Expand user commands or run Lua when user types a pattern
3. **Timers** - Run at intervals (for periodic actions like auto-healing)
4. **Keybindings** - Run when a key combination is pressed
5. **Buttons** - On-screen clickable buttons for quick commands

## Sound System:
- MSP Protocol: The MUD can send !!SOUND(name vol=50 loop=-1) triggers
- Soundpacks: Users can upload sound files organized in packs
- Spatial Audio: Use setSoundPosition for 3D sound positioning (HRTF)
- Common patterns: Indoor/outdoor ambience, combat sounds, navigation audio cues

## Guidelines:
1. Always provide complete, working Lua code
2. Use proper Lua syntax (-- for comments, ~= for not equal)
3. For random sounds, use math.random(min, max)
4. For stopping previous sounds before playing new ones, call stopSound first
5. When creating automation, output code blocks with metadata in this format:

\`\`\`trigger name="Room Indoor Detection" pattern="#\\$# Roomscape"
-- Your trigger Lua code here
loopSound("indoor", 50)
\`\`\`

\`\`\`alias name="Quick Heal" pattern="^qh$"
send("cast heal self")
\`\`\`

\`\`\`timer name="Auto Sip Health" interval=60000 repeating=true
if getVariable("hp") < 50 then
  send("sip health")
end
\`\`\`

\`\`\`keybinding name="Move North" keys="ArrowUp"
send("north")
\`\`\`

\`\`\`button name="Attack" color="red"
send("kill " .. getVariable("target"))
\`\`\`

## Important:
- Be conversational and helpful
- Explain what the script does briefly
- Offer to modify or extend scripts based on user feedback
- If users describe complex behavior, break it into multiple automation items
- For sound-based triggers, remember to stop previous ambient sounds before starting new ones`;

function parseCodeBlocks(content: string): { type: 'trigger' | 'alias' | 'timer' | 'keybinding' | 'button' | 'lua'; code: string; name?: string; pattern?: string; interval?: number; repeating?: boolean; keys?: string; color?: string }[] {
  const blocks: { type: 'trigger' | 'alias' | 'timer' | 'keybinding' | 'button' | 'lua'; code: string; name?: string; pattern?: string; interval?: number; repeating?: boolean; keys?: string; color?: string }[] = [];
  
  const regex = /```(trigger|alias|timer|keybinding|button|lua)([^\n]*)\n([\s\S]*?)```/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const type = match[1] as 'trigger' | 'alias' | 'timer' | 'keybinding' | 'button' | 'lua';
    const metadata = match[2].trim();
    const code = match[3].trim();
    
    const nameMatch = metadata.match(/name="([^"]+)"/);
    const patternMatch = metadata.match(/pattern="([^"]+)"/);
    const intervalMatch = metadata.match(/interval=(\d+)/);
    const repeatingMatch = metadata.match(/repeating=(true|false)/);
    const keysMatch = metadata.match(/keys="([^"]+)"/);
    const colorMatch = metadata.match(/color="([^"]+)"/);
    
    blocks.push({
      type,
      code,
      name: nameMatch?.[1],
      pattern: patternMatch?.[1],
      interval: intervalMatch ? parseInt(intervalMatch[1]) : undefined,
      repeating: repeatingMatch ? repeatingMatch[1] === 'true' : undefined,
      keys: keysMatch?.[1],
      color: colorMatch?.[1],
    });
  }
  
  return blocks;
}

export function ScriptAssistant({ open, onOpenChange, onCreateTrigger, onCreateAlias, onCreateTimer, onCreateKeybinding, onCreateButton }: ScriptAssistantProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const chatHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/ai/script-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatHistory, { role: 'user', content: userMessage.content }],
          systemPrompt: SYSTEM_PROMPT,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      let assistantContent = '';
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
      };

      setMessages(prev => [...prev, assistantMessage]);

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                assistantContent += data.content;
                setMessages(prev => {
                  const updated = [...prev];
                  const lastIndex = updated.length - 1;
                  if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
                    updated[lastIndex] = {
                      ...updated[lastIndex],
                      content: assistantContent,
                      codeBlocks: parseCodeBlocks(assistantContent),
                    };
                  }
                  return updated;
                });
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get AI response',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: 'Copied', description: 'Code copied to clipboard' });
  };

  const handleCreateAutomation = (block: { type: string; code: string; name?: string; pattern?: string; interval?: number; repeating?: boolean; keys?: string; color?: string }) => {
    const id = crypto.randomUUID();
    
    switch (block.type) {
      case 'trigger':
        onCreateTrigger?.({
          id,
          pattern: block.pattern || '',
          type: 'regex',
          script: block.code,
          active: true,
        });
        toast({ title: 'Trigger Created', description: `Created trigger: ${block.name || 'New Trigger'}` });
        break;
      case 'alias':
        onCreateAlias?.({
          id,
          pattern: block.pattern || '',
          command: block.code,
          active: true,
          isScript: true,
        });
        toast({ title: 'Alias Created', description: `Created alias: ${block.name || 'New Alias'}` });
        break;
      case 'timer':
        onCreateTimer?.({
          id,
          name: block.name || 'New Timer',
          interval: block.interval || 60000,
          script: block.code,
          active: true,
          oneShot: !(block.repeating ?? true),
        });
        toast({ title: 'Timer Created', description: `Created timer: ${block.name || 'New Timer'}` });
        break;
      case 'keybinding':
        onCreateKeybinding?.({
          id,
          key: block.keys || '',
          command: block.code,
          active: true,
          isScript: true,
        });
        toast({ title: 'Keybinding Created', description: `Created keybinding: ${block.name || 'New Keybinding'}` });
        break;
      case 'button':
        onCreateButton?.({
          id,
          label: block.name || 'New Button',
          command: block.code,
          color: block.color,
          active: true,
          isScript: true,
        });
        toast({ title: 'Button Created', description: `Created button: ${block.name || 'New Button'}` });
        break;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trigger': return <Zap className="w-4 h-4" />;
      case 'alias': return <Code className="w-4 h-4" />;
      case 'timer': return <Timer className="w-4 h-4" />;
      case 'keybinding': return <Keyboard className="w-4 h-4" />;
      case 'button': return <SquareMousePointer className="w-4 h-4" />;
      default: return <Code className="w-4 h-4" />;
    }
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    
    return (
      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[85%] rounded-lg p-3 ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
          <div className="whitespace-pre-wrap text-sm">{message.content.replace(/```[\s\S]*?```/g, '[Code block below]')}</div>
          
          {message.codeBlocks && message.codeBlocks.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.codeBlocks.map((block, idx) => (
                <div key={idx} className="bg-background/80 rounded-md border overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b">
                    <div className="flex items-center gap-2 text-xs font-medium">
                      {getTypeIcon(block.type)}
                      <span className="capitalize">{block.type}</span>
                      {block.name && <span className="text-muted-foreground">- {block.name}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleCopy(block.code, `${message.id}-${idx}`)}
                        data-testid={`button-copy-code-${idx}`}
                      >
                        {copiedId === `${message.id}-${idx}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </Button>
                      {block.type !== 'lua' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCreateAutomation(block)}
                          data-testid={`button-add-${block.type}-${idx}`}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <pre className="p-3 text-xs overflow-x-auto font-mono">{block.code}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Script Assistant
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-12">
              <Wand2 className="w-12 h-12 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">How can I help you script?</h3>
              <p className="text-sm max-w-md mb-6">
                Describe what you want your MUD automation to do. I can create triggers, aliases, timers, keybindings, and buttons with Lua scripting.
              </p>
              <div className="text-sm text-left space-y-2 max-w-lg">
                <p className="font-medium">Example requests:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>When I see "room_indoor", loop indoor.mp3 and stop outdoor sounds</li>
                  <li>Play a random cannon sound (cannon1-10.mp3) when I see "cannons fire"</li>
                  <li>Create a healing alias that checks my health and sips a potion</li>
                  <li>Make arrow keys send movement commands</li>
                </ul>
              </div>
            </div>
          ) : (
            messages.map(renderMessage)
          )}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex justify-start mb-4">
              <div className="bg-muted rounded-lg p-3">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
        </ScrollArea>

        <div className="px-6 py-4 border-t">
          <div className="flex gap-2">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Describe what you want your script to do..."
              className="min-h-[60px] resize-none"
              data-testid="textarea-script-input"
            />
            <Button 
              onClick={handleSend} 
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-[60px] w-[60px]"
              data-testid="button-send-message"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
