import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, SquareMousePointer, Wand2, GripVertical } from "lucide-react";
import { ScriptingWizard } from "@/components/ScriptingWizard";
import type { Profile, MudButton, MudClass } from "@shared/schema";
import { useUpdateProfile } from "@/hooks/use-profiles";
import { nanoid } from 'nanoid';

interface ButtonsPanelProps {
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BUTTON_COLORS = [
  { value: 'default', label: 'Default' },
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'destructive', label: 'Destructive' },
  { value: 'outline', label: 'Outline' },
];

export function ButtonsPanel({ profile, open, onOpenChange }: ButtonsPanelProps) {
  const updateMutation = useUpdateProfile();
  const buttons = (profile.buttons as MudButton[]) || [];
  const classes = (profile.classes as MudClass[]) || [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardTarget, setWizardTarget] = useState<'new' | string>('new');
  const [newButton, setNewButton] = useState<Partial<MudButton>>({
    label: '',
    command: '',
    isScript: false,
    color: 'default',
    active: true,
  });

  const saveButtons = (updatedButtons: MudButton[]) => {
    updateMutation.mutate({
      id: profile.id,
      buttons: updatedButtons,
    });
  };

  const addButton = () => {
    if (!newButton.label || !newButton.command) return;
    
    const button: MudButton = {
      id: nanoid(),
      label: newButton.label!,
      command: newButton.command!,
      isScript: newButton.isScript || false,
      color: newButton.color || 'default',
      classId: newButton.classId,
      active: true,
    };
    
    saveButtons([...buttons, button]);
    setNewButton({
      label: '',
      command: '',
      isScript: false,
      color: 'default',
      active: true,
    });
  };

  const updateButton = (id: string, updates: Partial<MudButton>) => {
    saveButtons(buttons.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteButton = (id: string) => {
    saveButtons(buttons.filter(b => b.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const toggleButton = (id: string, active: boolean) => {
    updateButton(id, { active });
  };

  const openWizardFor = (target: 'new' | string) => {
    setWizardTarget(target);
    setWizardOpen(true);
  };

  const handleWizardInsert = (script: string) => {
    if (wizardTarget === 'new') {
      setNewButton({ ...newButton, command: script, isScript: true });
    } else {
      updateButton(wizardTarget, { command: script, isScript: true });
    }
    setWizardOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] border-l border-border bg-card overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl flex items-center gap-2">
            <SquareMousePointer className="w-5 h-5" />
            Buttons
          </SheetTitle>
          <SheetDescription>
            Create on-screen buttons to quickly send commands.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add New Button</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input
                    data-testid="input-button-label"
                    value={newButton.label}
                    onChange={(e) => setNewButton({ ...newButton, label: e.target.value })}
                    placeholder="Heal"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Select
                    value={newButton.color}
                    onValueChange={(val) => setNewButton({ ...newButton, color: val })}
                  >
                    <SelectTrigger data-testid="select-button-color">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BUTTON_COLORS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mode</Label>
                  <Select
                    value={newButton.isScript ? 'script' : 'command'}
                    onValueChange={(val) => setNewButton({ ...newButton, isScript: val === 'script' })}
                  >
                    <SelectTrigger data-testid="select-button-mode">
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
                    value={newButton.classId || '__none__'}
                    onValueChange={(val) => setNewButton({ ...newButton, classId: val === '__none__' ? undefined : val })}
                  >
                    <SelectTrigger data-testid="select-button-class">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{newButton.isScript ? 'Lua Script' : 'Command'}</Label>
                  {newButton.isScript && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openWizardFor('new')}
                      className="h-7 text-xs"
                      data-testid="button-wizard-new"
                    >
                      <Wand2 className="w-3 h-3 mr-1" />
                      AI Generate
                    </Button>
                  )}
                </div>
                {newButton.isScript ? (
                  <Textarea
                    data-testid="input-button-script"
                    value={newButton.command}
                    onChange={(e) => setNewButton({ ...newButton, command: e.target.value })}
                    placeholder="send('heal')"
                    className="font-mono text-sm min-h-[80px]"
                  />
                ) : (
                  <Input
                    data-testid="input-button-command"
                    value={newButton.command}
                    onChange={(e) => setNewButton({ ...newButton, command: e.target.value })}
                    placeholder="heal self"
                    className="font-mono text-sm"
                  />
                )}
              </div>

              <Button
                onClick={addButton}
                disabled={!newButton.label || !newButton.command}
                className="w-full"
                data-testid="button-add-button"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Button
              </Button>
            </CardContent>
          </Card>

          {buttons.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Existing Buttons ({buttons.length})
              </h3>
              
              {buttons.map((button) => (
                <Card key={button.id} className={!button.active ? 'opacity-50' : ''}>
                  <CardContent className="p-4">
                    {editingId === button.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={button.label}
                            onChange={(e) => updateButton(button.id, { label: e.target.value })}
                            placeholder="Label"
                          />
                          <Select
                            value={button.color || 'default'}
                            onValueChange={(val) => updateButton(button.id, { color: val })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {BUTTON_COLORS.map((c) => (
                                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Select
                            value={button.isScript ? 'script' : 'command'}
                            onValueChange={(val) => updateButton(button.id, { isScript: val === 'script' })}
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
                            value={button.classId || '__none__'}
                            onValueChange={(val) => updateButton(button.id, { classId: val === '__none__' ? undefined : val })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="No Class" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">None</SelectItem>
                              {classes.map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">{button.isScript ? 'Script' : 'Command'}</Label>
                          {button.isScript && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openWizardFor(button.id)}
                              className="h-6 text-xs"
                            >
                              <Wand2 className="w-3 h-3 mr-1" />
                              AI
                            </Button>
                          )}
                        </div>
                        {button.isScript ? (
                          <Textarea
                            value={button.command}
                            onChange={(e) => updateButton(button.id, { command: e.target.value })}
                            className="font-mono text-sm min-h-[80px]"
                          />
                        ) : (
                          <Input
                            value={button.command}
                            onChange={(e) => updateButton(button.id, { command: e.target.value })}
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
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                          <div 
                            className="cursor-pointer"
                            onClick={() => setEditingId(button.id)}
                          >
                            <div className="font-medium text-sm">
                              {button.label}
                            </div>
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {button.isScript ? 'Lua Script' : button.command}
                              {button.classId && ` • ${classes.find(c => c.id === button.classId)?.name}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={button.active}
                            onCheckedChange={(val) => toggleButton(button.id, val)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteButton(button.id)}
                            data-testid={`button-delete-button-${button.id}`}
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
