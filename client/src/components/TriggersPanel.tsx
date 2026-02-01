import { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Zap, Wand2, ChevronDown, ChevronRight, Search, FolderOpen, Folder, CheckSquare, Square, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScriptingWizard } from "@/components/ScriptingWizard";
import type { Profile, MudTrigger, MudClass } from "@shared/schema";
import { useUpdateProfile } from "@/hooks/use-profiles";
import { nanoid } from 'nanoid';

interface TriggersPanelProps {
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TriggerCardProps {
  trigger: MudTrigger;
  classes: MudClass[];
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  updateTrigger: (id: string, updates: Partial<MudTrigger>) => void;
  deleteTrigger: (id: string) => void;
  toggleTrigger: (id: string, active: boolean) => void;
  openWizardFor: (target: string) => void;
  selectMode: boolean;
  isSelected: boolean;
  onSelectToggle: (id: string) => void;
}

function TriggerCard({ trigger, classes, editingId, setEditingId, updateTrigger, deleteTrigger, toggleTrigger, openWizardFor, selectMode, isSelected, onSelectToggle }: TriggerCardProps) {
  if (editingId === trigger.id) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <Input
            value={trigger.pattern}
            onChange={(e) => updateTrigger(trigger.id, { pattern: e.target.value })}
            className="font-mono text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={trigger.type}
              onValueChange={(val) => updateTrigger(trigger.id, { type: val as 'regex' | 'plain' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regex">Regex</SelectItem>
                <SelectItem value="plain">Plain Text</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={trigger.classId || '__none__'}
              onValueChange={(val) => updateTrigger(trigger.id, { classId: val === '__none__' ? undefined : val })}
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
            <Label className="text-xs">Script</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openWizardFor(trigger.id)}
              className="h-6 text-xs"
            >
              <Wand2 className="w-3 h-3 mr-1" />
              AI
            </Button>
          </div>
          <Textarea
            value={trigger.script}
            onChange={(e) => updateTrigger(trigger.id, { script: e.target.value })}
            className="font-mono text-sm min-h-[80px]"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditingId(null)}
          >
            Done
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${!trigger.active ? 'opacity-50' : ''} ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-3">
          {selectMode && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelectToggle(trigger.id)}
              className="mt-1"
              data-testid={`checkbox-trigger-${trigger.id}`}
            />
          )}
          <div 
            className="flex-1 cursor-pointer min-w-0"
            onClick={() => selectMode ? onSelectToggle(trigger.id) : setEditingId(trigger.id)}
          >
            <div className="font-mono text-sm text-primary truncate">
              {trigger.pattern}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {trigger.type}
              {trigger.soundFile && ` • Sound: ${trigger.soundFile}`}
            </div>
          </div>
          {!selectMode && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Switch
                checked={trigger.active}
                onCheckedChange={(val) => toggleTrigger(trigger.id, val)}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteTrigger(trigger.id)}
                data-testid={`button-delete-trigger-${trigger.id}`}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function TriggersPanel({ profile, open, onOpenChange }: TriggersPanelProps) {
  const updateMutation = useUpdateProfile();
  const triggers = (profile.triggers as MudTrigger[]) || [];
  const classes = (profile.classes as MudClass[]) || [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardTarget, setWizardTarget] = useState<'new' | string>('new');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [newTrigger, setNewTrigger] = useState<Partial<MudTrigger>>({
    pattern: '',
    type: 'regex',
    script: '',
    active: true,
  });

  const toggleSelectMode = () => {
    if (selectMode) {
      setSelectedIds(new Set());
    }
    setSelectMode(!selectMode);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredTriggers.map(t => t.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const deleteSelected = () => {
    saveTriggers(triggers.filter(t => !selectedIds.has(t.id)));
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const moveSelectedToClass = (classId: string | undefined) => {
    saveTriggers(triggers.map(t => selectedIds.has(t.id) ? { ...t, classId } : t));
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const toggleSelectedActive = (active: boolean) => {
    saveTriggers(triggers.map(t => selectedIds.has(t.id) ? { ...t, active } : t));
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const filteredTriggers = useMemo(() => {
    if (!searchQuery.trim()) return triggers;
    const query = searchQuery.toLowerCase();
    return triggers.filter(t => 
      (t.pattern || '').toLowerCase().includes(query) ||
      (t.script || '').toLowerCase().includes(query) ||
      (t.classId && (classes.find(c => c.id === t.classId)?.name || '').toLowerCase().includes(query))
    );
  }, [triggers, searchQuery, classes]);

  const groupedTriggers = useMemo(() => {
    const groups: Record<string, MudTrigger[]> = { '__ungrouped__': [] };
    classes.forEach(c => { groups[c.id] = []; });
    
    filteredTriggers.forEach(trigger => {
      const groupId = trigger.classId || '__ungrouped__';
      if (!groups[groupId]) groups[groupId] = [];
      groups[groupId].push(trigger);
    });
    
    return groups;
  }, [filteredTriggers, classes]);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const saveTriggers = (updatedTriggers: MudTrigger[]) => {
    updateMutation.mutate({
      id: profile.id,
      triggers: updatedTriggers,
    });
  };

  const addTrigger = () => {
    if (!newTrigger.pattern || !newTrigger.script) return;
    
    const trigger: MudTrigger = {
      id: nanoid(),
      pattern: newTrigger.pattern!,
      type: newTrigger.type || 'regex',
      script: newTrigger.script!,
      classId: newTrigger.classId,
      active: true,
      soundFile: newTrigger.soundFile,
      soundVolume: newTrigger.soundVolume,
      soundLoop: newTrigger.soundLoop,
    };
    
    saveTriggers([...triggers, trigger]);
    setNewTrigger({
      pattern: '',
      type: 'regex',
      script: '',
      active: true,
    });
  };

  const updateTrigger = (id: string, updates: Partial<MudTrigger>) => {
    saveTriggers(triggers.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTrigger = (id: string) => {
    saveTriggers(triggers.filter(t => t.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const toggleTrigger = (id: string, active: boolean) => {
    updateTrigger(id, { active });
  };

  const openWizardFor = (target: 'new' | string) => {
    setWizardTarget(target);
    setWizardOpen(true);
  };

  const handleWizardInsert = (script: string) => {
    if (wizardTarget === 'new') {
      setNewTrigger({ ...newTrigger, script });
    } else {
      updateTrigger(wizardTarget, { script });
    }
    setWizardOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] border-l border-border bg-card overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Triggers
          </SheetTitle>
          <SheetDescription>
            Run scripts when text patterns appear from the MUD.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add New Trigger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Pattern</Label>
                <Input
                  data-testid="input-trigger-pattern"
                  value={newTrigger.pattern}
                  onChange={(e) => setNewTrigger({ ...newTrigger, pattern: e.target.value })}
                  placeholder="^You have (\d+) health points"
                  className="font-mono text-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={newTrigger.type}
                    onValueChange={(val) => setNewTrigger({ ...newTrigger, type: val as 'regex' | 'plain' })}
                  >
                    <SelectTrigger data-testid="select-trigger-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regex">Regex</SelectItem>
                      <SelectItem value="plain">Plain Text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Class (optional)</Label>
                  <Select
                    value={newTrigger.classId || '__none__'}
                    onValueChange={(val) => setNewTrigger({ ...newTrigger, classId: val === '__none__' ? undefined : val })}
                  >
                    <SelectTrigger data-testid="select-trigger-class">
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
                  <Label>Lua Script</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openWizardFor('new')}
                    className="h-7 text-xs"
                    data-testid="button-trigger-wizard-new"
                  >
                    <Wand2 className="w-3 h-3 mr-1" />
                    AI Generate
                  </Button>
                </div>
                <Textarea
                  data-testid="input-trigger-script"
                  value={newTrigger.script}
                  onChange={(e) => setNewTrigger({ ...newTrigger, script: e.target.value })}
                  placeholder="-- Access captured groups via matches[1], matches[2], etc.&#10;local health = tonumber(matches[1])&#10;if health < 100 then send('heal') end"
                  className="font-mono text-sm min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs">Sound (optional)</Label>
                  <Input
                    value={newTrigger.soundFile || ''}
                    onChange={(e) => setNewTrigger({ ...newTrigger, soundFile: e.target.value })}
                    placeholder="alert"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Volume</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={(newTrigger.soundVolume || 1) * 100}
                    onChange={(e) => setNewTrigger({ ...newTrigger, soundVolume: parseInt(e.target.value) / 100 })}
                    className="text-sm"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newTrigger.soundLoop || false}
                      onCheckedChange={(val) => setNewTrigger({ ...newTrigger, soundLoop: val })}
                    />
                    <Label className="text-xs">Loop</Label>
                  </div>
                </div>
              </div>

              <Button
                onClick={addTrigger}
                disabled={!newTrigger.pattern || !newTrigger.script}
                className="w-full"
                data-testid="button-add-trigger"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Trigger
              </Button>
            </CardContent>
          </Card>

          {triggers.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Triggers ({triggers.length})
                </h3>
                <Button
                  variant={selectMode ? "default" : "outline"}
                  size="sm"
                  onClick={toggleSelectMode}
                  data-testid="button-select-mode-triggers"
                >
                  {selectMode ? <X className="w-4 h-4 mr-1" /> : <CheckSquare className="w-4 h-4 mr-1" />}
                  {selectMode ? "Cancel" : "Select"}
                </Button>
              </div>

              {selectMode && (
                <Card className="bg-muted/50">
                  <CardContent className="p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{selectedIds.size} selected</span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={selectAll} data-testid="button-select-all-triggers">
                          Select All
                        </Button>
                        <Button variant="ghost" size="sm" onClick={deselectAll} data-testid="button-deselect-all-triggers">
                          Clear
                        </Button>
                      </div>
                    </div>
                    {selectedIds.size > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <Button variant="destructive" size="sm" onClick={deleteSelected} data-testid="button-delete-selected-triggers">
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => toggleSelectedActive(true)} data-testid="button-enable-selected-triggers">
                          Enable
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => toggleSelectedActive(false)} data-testid="button-disable-selected-triggers">
                          Disable
                        </Button>
                        <Select onValueChange={(val) => moveSelectedToClass(val === '__none__' ? undefined : val)}>
                          <SelectTrigger className="w-[140px] h-8" data-testid="select-move-triggers-class">
                            <SelectValue placeholder="Move to class" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">No Class</SelectItem>
                            {classes.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search triggers..."
                  className="pl-9"
                  data-testid="input-search-triggers"
                />
              </div>
              
              {groupedTriggers['__ungrouped__']?.length > 0 && (
                <Collapsible open={!collapsedGroups.has('__ungrouped__')} onOpenChange={() => toggleGroup('__ungrouped__')}>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover-elevate rounded-md">
                    {collapsedGroups.has('__ungrouped__') ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    <Folder className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Ungrouped</span>
                    <Badge variant="secondary" className="ml-auto">{groupedTriggers['__ungrouped__'].length}</Badge>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-2 ml-6">
                    {groupedTriggers['__ungrouped__'].map((trigger) => (
                      <TriggerCard
                        key={trigger.id}
                        trigger={trigger}
                        classes={classes}
                        editingId={editingId}
                        setEditingId={setEditingId}
                        updateTrigger={updateTrigger}
                        deleteTrigger={deleteTrigger}
                        toggleTrigger={toggleTrigger}
                        openWizardFor={openWizardFor}
                        selectMode={selectMode}
                        isSelected={selectedIds.has(trigger.id)}
                        onSelectToggle={toggleSelection}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {classes.map(cls => {
                const clsTriggers = groupedTriggers[cls.id] || [];
                if (clsTriggers.length === 0) return null;
                
                return (
                  <Collapsible key={cls.id} open={!collapsedGroups.has(cls.id)} onOpenChange={() => toggleGroup(cls.id)}>
                    <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover-elevate rounded-md">
                      {collapsedGroups.has(cls.id) ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      <FolderOpen className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">{cls.name}</span>
                      <Badge variant={cls.active ? "default" : "secondary"} className="ml-auto">
                        {clsTriggers.length}
                      </Badge>
                      {!cls.active && <Badge variant="outline" className="text-xs">Disabled</Badge>}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 mt-2 ml-6">
                      {clsTriggers.map((trigger) => (
                        <TriggerCard
                          key={trigger.id}
                          trigger={trigger}
                          classes={classes}
                          editingId={editingId}
                          setEditingId={setEditingId}
                          updateTrigger={updateTrigger}
                          deleteTrigger={deleteTrigger}
                          toggleTrigger={toggleTrigger}
                          openWizardFor={openWizardFor}
                          selectMode={selectMode}
                          isSelected={selectedIds.has(trigger.id)}
                          onSelectToggle={toggleSelection}
                        />
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}

              {filteredTriggers.length === 0 && searchQuery && (
                <div className="text-center text-muted-foreground py-4 text-sm">
                  No triggers match "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>

      <ScriptingWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        context="trigger"
        onInsert={handleWizardInsert}
      />
    </Sheet>
  );
}
