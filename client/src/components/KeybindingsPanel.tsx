import { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Keyboard, Wand2 } from "lucide-react";
import { ScriptingWizard } from "@/components/ScriptingWizard";
import type { Profile, MudKeybinding } from "@shared/schema";
import { useUpdateProfile } from "@/hooks/use-profiles";
import { nanoid } from 'nanoid';
import { parseKeyCombo, formatKeyCombo } from '@/lib/text-utils';

interface KeybindingsPanelProps {
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeybindingsPanel({ profile, open, onOpenChange }: KeybindingsPanelProps) {
  const updateMutation = useUpdateProfile();
  const keybindings = (profile.keybindings as MudKeybinding[]) || [];
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<HTMLInputElement>(null);
  const [newBinding, setNewBinding] = useState<Partial<MudKeybinding>>({
    key: '',
    command: '',
    isScript: false,
    active: true,
  });

  useEffect(() => {
    if (!isRecording) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const combo = parseKeyCombo(e);
      if (combo && !['Ctrl', 'Alt', 'Shift', 'Meta'].includes(combo)) {
        setNewBinding({ ...newBinding, key: combo });
        setIsRecording(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, newBinding]);

  const saveKeybindings = (updated: MudKeybinding[]) => {
    updateMutation.mutate({
      id: profile.id,
      keybindings: updated,
    });
  };

  const addKeybinding = () => {
    if (!newBinding.key || !newBinding.command) return;
    
    const binding: MudKeybinding = {
      id: nanoid(),
      key: newBinding.key!,
      command: newBinding.command!,
      isScript: newBinding.isScript || false,
      active: true,
    };
    
    saveKeybindings([...keybindings, binding]);
    setNewBinding({
      key: '',
      command: '',
      isScript: false,
      active: true,
    });
  };

  const deleteKeybinding = (id: string) => {
    saveKeybindings(keybindings.filter(kb => kb.id !== id));
  };

  const toggleKeybinding = (id: string, active: boolean) => {
    saveKeybindings(keybindings.map(kb => kb.id === id ? { ...kb, active } : kb));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] border-l border-border bg-card overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keybindings
          </SheetTitle>
          <SheetDescription>
            Map keyboard shortcuts to commands or scripts.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add New Keybinding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Key Combination</Label>
                <div className="flex gap-2">
                  <Input
                    ref={recordingRef}
                    data-testid="input-keybinding-key"
                    value={newBinding.key ? formatKeyCombo(newBinding.key) : ''}
                    placeholder={isRecording ? 'Press any key...' : 'Click to record'}
                    readOnly
                    className={isRecording ? 'ring-2 ring-primary' : ''}
                    onFocus={() => setIsRecording(true)}
                    onBlur={() => setTimeout(() => setIsRecording(false), 100)}
                  />
                  <Button
                    data-testid="button-record-key"
                    variant="outline"
                    onClick={() => {
                      setIsRecording(true);
                      recordingRef.current?.focus();
                    }}
                  >
                    Record
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  data-testid="switch-keybinding-isscript"
                  checked={newBinding.isScript}
                  onCheckedChange={(checked) => setNewBinding({ ...newBinding, isScript: checked })}
                />
                <Label>Execute as Lua script (instead of MUD command)</Label>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{newBinding.isScript ? 'Lua Script' : 'Command'}</Label>
                  {newBinding.isScript && (
                    <ScriptingWizard 
                      context="keybinding" 
                      onInsert={(script) => setNewBinding({ ...newBinding, command: script })}
                      triggerButton={
                        <Button variant="ghost" size="sm" data-testid="button-keybinding-wizard">
                          <Wand2 className="w-4 h-4 mr-1" />
                          AI Wizard
                        </Button>
                      }
                    />
                  )}
                </div>
                {newBinding.isScript ? (
                  <Textarea
                    data-testid="textarea-keybinding-command"
                    value={newBinding.command}
                    onChange={(e) => setNewBinding({ ...newBinding, command: e.target.value })}
                    placeholder="send('attack')"
                    className="font-mono text-sm"
                    rows={3}
                  />
                ) : (
                  <Input
                    data-testid="input-keybinding-command"
                    value={newBinding.command}
                    onChange={(e) => setNewBinding({ ...newBinding, command: e.target.value })}
                    placeholder="e.g., look north"
                  />
                )}
              </div>
              <Button 
                data-testid="button-add-keybinding"
                onClick={addKeybinding} 
                disabled={!newBinding.key || !newBinding.command}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Keybinding
              </Button>
            </CardContent>
          </Card>

          {keybindings.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No keybindings configured yet.</p>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Keybindings ({keybindings.length})
              </h3>
              {keybindings.map((binding) => (
                <Card key={binding.id} className={!binding.active ? 'opacity-50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border">
                            {formatKeyCombo(binding.key)}
                          </kbd>
                          {binding.isScript && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">script</span>
                          )}
                        </div>
                        <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-x-auto">
                          {binding.command.substring(0, 100)}{binding.command.length > 100 ? '...' : ''}
                        </pre>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch
                          data-testid={`switch-keybinding-active-${binding.id}`}
                          checked={binding.active}
                          onCheckedChange={(checked) => toggleKeybinding(binding.id, checked)}
                        />
                        <Button
                          data-testid={`button-delete-keybinding-${binding.id}`}
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteKeybinding(binding.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
