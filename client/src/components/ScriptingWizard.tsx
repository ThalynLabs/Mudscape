import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Wand2, Copy, Check, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getApiKeyLocal, decryptApiKey, getStorageMode } from '@/lib/crypto-utils';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ScriptingWizardProps {
  onInsert?: (script: string) => void;
  context?: 'trigger' | 'alias' | 'timer' | 'keybinding';
  triggerButton?: React.ReactNode;
}

const LUA_API_DOCS = `
Available Lua API functions:
- send(command) - Send a command to the MUD server
- echo(text) - Display text locally in the terminal (yellow)
- setVariable(name, value) - Store a persistent variable
- getVariable(name) - Retrieve a stored variable
- playSound(name, volume, loop) - Play a sound from the active soundpack
- stopSound(name) - Stop a playing sound
- loopSound(name, volume) - Start looping a sound
- setSoundPosition(name, x, y, z) - Set 3D position for spatial audio

Built-in variables available in triggers:
- line - The matched line from the MUD
- matches - Table of regex capture groups (matches[0] = full match, matches[1] = first group, etc.)
`;

export function ScriptingWizard({ onInsert, context = 'trigger', triggerButton }: ScriptingWizardProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [generatedScript, setGeneratedScript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [noKeyError, setNoKeyError] = useState(false);

  const getApiKey = async (): Promise<string | null> => {
    const mode = getStorageMode();
    if (mode === 'none') {
      return null;
    }
    if (mode === 'local') {
      return getApiKeyLocal();
    }
    if (mode === 'encrypted') {
      if (!password) {
        setNeedsPassword(true);
        return null;
      }
      const key = await decryptApiKey(password);
      if (!key) {
        toast({ title: "Error", description: "Incorrect password", variant: "destructive" });
        return null;
      }
      setNeedsPassword(false);
      return key;
    }
    return null;
  };

  const handleGenerate = async () => {
    const apiKey = await getApiKey();
    if (!apiKey) {
      if (!needsPassword) {
        setNoKeyError(true);
      }
      return;
    }
    
    setNoKeyError(false);
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/ai/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          description, 
          context,
          apiKey 
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to generate script');
      }
      
      const data = await res.json();
      setGeneratedScript(data.script);
    } catch (err) {
      toast({ 
        title: "Error", 
        description: err instanceof Error ? err.message : 'Failed to generate script',
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied", description: "Script copied to clipboard" });
  };

  const handleInsert = () => {
    onInsert?.(generatedScript);
    setOpen(false);
    setDescription('');
    setGeneratedScript('');
    toast({ title: "Inserted", description: "Script inserted into editor" });
  };

  const contextHints: Record<string, string> = {
    trigger: "Triggers run when text matches a pattern. Use 'line' for the matched text and 'matches' for capture groups.",
    alias: "Aliases expand commands. The user's input is available in 'line' and capture groups in 'matches'.",
    timer: "Timers run at intervals. Good for periodic actions like auto-healing or status checks.",
    keybinding: "Keybindings run when a key combo is pressed. Good for quick actions like directional movement.",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" size="sm" data-testid="button-scripting-wizard">
            <Wand2 className="w-4 h-4 mr-2" />
            AI Wizard
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Script Writing Assistant
          </DialogTitle>
          <DialogDescription>
            Describe what you want your script to do, and AI will write the Lua code for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {noKeyError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No API key configured. Go to Settings to add your OpenAI API key.
              </AlertDescription>
            </Alert>
          )}

          {needsPassword && (
            <div className="space-y-2">
              <Label>Enter password to unlock your API key</Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-wizard-password"
                />
                <Button onClick={handleGenerate} data-testid="button-unlock-generate">
                  Unlock & Generate
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">What should this script do?</Label>
            <Textarea
              id="description"
              placeholder={`Example: When I see "You are hungry", automatically eat bread from my inventory`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              data-testid="textarea-script-description"
            />
            <p className="text-xs text-muted-foreground">
              {contextHints[context]}
            </p>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={!description.trim() || isLoading}
            data-testid="button-generate-script"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Script
              </>
            )}
          </Button>

          {generatedScript && (
            <div className="space-y-2">
              <Label>Generated Lua Script</Label>
              <div className="relative">
                <pre className="p-4 bg-muted rounded-md text-sm overflow-x-auto font-mono whitespace-pre-wrap">
                  {generatedScript}
                </pre>
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button variant="ghost" size="icon" onClick={handleCopy} data-testid="button-copy-script">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-2">
                {onInsert && (
                  <Button onClick={handleInsert} data-testid="button-insert-script">
                    Insert into Editor
                  </Button>
                )}
                <Button variant="outline" onClick={() => setGeneratedScript('')}>
                  Clear
                </Button>
              </div>
            </div>
          )}

          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              View available Lua API
            </summary>
            <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-x-auto whitespace-pre-wrap">
              {LUA_API_DOCS.trim()}
            </pre>
          </details>
        </div>
      </DialogContent>
    </Dialog>
  );
}
