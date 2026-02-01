import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Terminal, Wand2 } from "lucide-react";
import { ScriptingWizard } from "@/components/ScriptingWizard";
import type { Profile, MudAlias, MudClass } from "@shared/schema";
import { useUpdateProfile } from "@/hooks/use-profiles";
import { nanoid } from 'nanoid';

interface AliasesPanelProps {
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AliasesPanel({ profile, open, onOpenChange }: AliasesPanelProps) {
  const updateMutation = useUpdateProfile();
  const aliases = (profile.aliases as MudAlias[]) || [];
  const classes = (profile.classes as MudClass[]) || [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardTarget, setWizardTarget] = useState<'new' | string>('new');
  const [newAlias, setNewAlias] = useState<Partial<MudAlias>>({
    pattern: '',
    command: '',
    isScript: false,
    active: true,
  });

  const saveAliases = (updatedAliases: MudAlias[]) => {
    updateMutation.mutate({
      id: profile.id,
      aliases: updatedAliases,
    });
  };

  const addAlias = () => {
    if (!newAlias.pattern || !newAlias.command) return;
    
    const alias: MudAlias = {
      id: nanoid(),
      pattern: newAlias.pattern!,
      command: newAlias.command!,
      isScript: newAlias.isScript || false,
      classId: newAlias.classId,
      active: true,
    };
    
    saveAliases([...aliases, alias]);
    setNewAlias({
      pattern: '',
      command: '',
      isScript: false,
      active: true,
    });
  };

  const updateAlias = (id: string, updates: Partial<MudAlias>) => {
    saveAliases(aliases.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteAlias = (id: string) => {
    saveAliases(aliases.filter(a => a.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const toggleAlias = (id: string, active: boolean) => {
    updateAlias(id, { active });
  };

  const openWizardFor = (target: 'new' | string) => {
    setWizardTarget(target);
    setWizardOpen(true);
  };

  const handleWizardInsert = (script: string) => {
    if (wizardTarget === 'new') {
      setNewAlias({ ...newAlias, command: script, isScript: true });
    } else {
      updateAlias(wizardTarget, { command: script, isScript: true });
    }
    setWizardOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] border-l border-border bg-card overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            Aliases
          </SheetTitle>
          <SheetDescription>
            Create shortcuts for commands or run Lua scripts.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add New Alias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Pattern (regex)</Label>
                <Input
                  data-testid="input-alias-pattern"
                  value={newAlias.pattern}
                  onChange={(e) => setNewAlias({ ...newAlias, pattern: e.target.value })}
                  placeholder="^tt (.*)$"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Use $1, $2, etc. for capture groups in command mode
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mode</Label>
                  <Select
                    value={newAlias.isScript ? 'script' : 'command'}
                    onValueChange={(val) => setNewAlias({ ...newAlias, isScript: val === 'script' })}
                  >
                    <SelectTrigger data-testid="select-alias-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="command">Command</SelectItem>
                      <SelectItem value="script">Lua Script</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Class (optional)</Label>
                  <Select
                    value={newAlias.classId || ''}
                    onValueChange={(val) => setNewAlias({ ...newAlias, classId: val || undefined })}
                  >
                    <SelectTrigger data-testid="select-alias-class">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{newAlias.isScript ? 'Lua Script' : 'Command'}</Label>
                  {newAlias.isScript && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openWizardFor('new')}
                      className="h-7 text-xs"
                      data-testid="button-alias-wizard-new"
                    >
                      <Wand2 className="w-3 h-3 mr-1" />
                      AI Generate
                    </Button>
                  )}
                </div>
                {newAlias.isScript ? (
                  <Textarea
                    data-testid="input-alias-script"
                    value={newAlias.command}
                    onChange={(e) => setNewAlias({ ...newAlias, command: e.target.value })}
                    placeholder="-- Access captured groups via matches[1], matches[2], etc.&#10;send('tell ' .. target .. ' ' .. matches[1])"
                    className="font-mono text-sm min-h-[100px]"
                  />
                ) : (
                  <Input
                    data-testid="input-alias-command"
                    value={newAlias.command}
                    onChange={(e) => setNewAlias({ ...newAlias, command: e.target.value })}
                    placeholder="tell target $1"
                    className="font-mono text-sm"
                  />
                )}
              </div>

              <Button
                onClick={addAlias}
                disabled={!newAlias.pattern || !newAlias.command}
                className="w-full"
                data-testid="button-add-alias"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Alias
              </Button>
            </CardContent>
          </Card>

          {aliases.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Existing Aliases ({aliases.length})
              </h3>
              
              {aliases.map((alias) => (
                <Card key={alias.id} className={!alias.active ? 'opacity-50' : ''}>
                  <CardContent className="p-4">
                    {editingId === alias.id ? (
                      <div className="space-y-3">
                        <Input
                          value={alias.pattern}
                          onChange={(e) => updateAlias(alias.id, { pattern: e.target.value })}
                          className="font-mono text-sm"
                          placeholder="Pattern"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Select
                            value={alias.isScript ? 'script' : 'command'}
                            onValueChange={(val) => updateAlias(alias.id, { isScript: val === 'script' })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="command">Command</SelectItem>
                              <SelectItem value="script">Lua Script</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={alias.classId || ''}
                            onValueChange={(val) => updateAlias(alias.id, { classId: val || undefined })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="No Class" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {classes.map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">{alias.isScript ? 'Script' : 'Command'}</Label>
                          {alias.isScript && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openWizardFor(alias.id)}
                              className="h-6 text-xs"
                            >
                              <Wand2 className="w-3 h-3 mr-1" />
                              AI
                            </Button>
                          )}
                        </div>
                        {alias.isScript ? (
                          <Textarea
                            value={alias.command}
                            onChange={(e) => updateAlias(alias.id, { command: e.target.value })}
                            className="font-mono text-sm min-h-[80px]"
                          />
                        ) : (
                          <Input
                            value={alias.command}
                            onChange={(e) => updateAlias(alias.id, { command: e.target.value })}
                            className="font-mono text-sm"
                          />
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingId(null)}
                        >
                          Done
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => setEditingId(alias.id)}
                        >
                          <div className="font-mono text-sm text-primary truncate">
                            {alias.pattern}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 truncate">
                            {alias.isScript ? 'Script' : alias.command}
                            {alias.classId && ` • ${classes.find(c => c.id === alias.classId)?.name}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={alias.active}
                            onCheckedChange={(val) => toggleAlias(alias.id, val)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteAlias(alias.id)}
                            data-testid={`button-delete-alias-${alias.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SheetContent>

      <ScriptingWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        context="alias"
        onInsert={handleWizardInsert}
      />
    </Sheet>
  );
}
