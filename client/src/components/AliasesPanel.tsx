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
import { Plus, Trash2, Terminal, Wand2, ChevronDown, ChevronRight, Search, FolderOpen, Folder, CheckSquare, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScriptingWizard } from "@/components/ScriptingWizard";
import type { Profile, MudAlias, MudClass } from "@shared/schema";
import { useUpdateProfile } from "@/hooks/use-profiles";
import { nanoid } from 'nanoid';

interface AliasesPanelProps {
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AliasCardProps {
  alias: MudAlias;
  classes: MudClass[];
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  updateAlias: (id: string, updates: Partial<MudAlias>) => void;
  deleteAlias: (id: string) => void;
  toggleAlias: (id: string, active: boolean) => void;
  openWizardFor: (target: string) => void;
  selectMode: boolean;
  isSelected: boolean;
  onSelectToggle: (id: string) => void;
}

function AliasCard({ alias, classes, editingId, setEditingId, updateAlias, deleteAlias, toggleAlias, openWizardFor, selectMode, isSelected, onSelectToggle }: AliasCardProps) {
  if (editingId === alias.id) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
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
              value={alias.classId || '__none__'}
              onValueChange={(val) => updateAlias(alias.id, { classId: val === '__none__' ? undefined : val })}
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
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${!alias.active ? 'opacity-50' : ''} ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-3">
          {selectMode && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelectToggle(alias.id)}
              className="mt-1"
              data-testid={`checkbox-alias-${alias.id}`}
            />
          )}
          <div 
            className="flex-1 cursor-pointer min-w-0"
            onClick={() => selectMode ? onSelectToggle(alias.id) : setEditingId(alias.id)}
          >
            <div className="font-mono text-sm text-primary truncate">
              {alias.pattern}
            </div>
            <div className="text-xs text-muted-foreground mt-1 truncate">
              {alias.isScript ? 'Script' : alias.command}
            </div>
          </div>
          {!selectMode && (
            <div className="flex items-center gap-2 flex-shrink-0">
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
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function AliasesPanel({ profile, open, onOpenChange }: AliasesPanelProps) {
  const updateMutation = useUpdateProfile();
  const aliases = (profile.aliases as MudAlias[]) || [];
  const classes = (profile.classes as MudClass[]) || [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardTarget, setWizardTarget] = useState<'new' | string>('new');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [newAlias, setNewAlias] = useState<Partial<MudAlias>>({
    pattern: '',
    command: '',
    isScript: false,
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
    setSelectedIds(new Set(filteredAliases.map(a => a.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const deleteSelected = () => {
    saveAliases(aliases.filter(a => !selectedIds.has(a.id)));
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const moveSelectedToClass = (classId: string | undefined) => {
    saveAliases(aliases.map(a => selectedIds.has(a.id) ? { ...a, classId } : a));
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const toggleSelectedActive = (active: boolean) => {
    saveAliases(aliases.map(a => selectedIds.has(a.id) ? { ...a, active } : a));
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const filteredAliases = useMemo(() => {
    if (!searchQuery.trim()) return aliases;
    const query = searchQuery.toLowerCase();
    return aliases.filter(a => 
      (a.pattern || '').toLowerCase().includes(query) ||
      (a.command || '').toLowerCase().includes(query) ||
      (a.classId && (classes.find(c => c.id === a.classId)?.name || '').toLowerCase().includes(query))
    );
  }, [aliases, searchQuery, classes]);

  const groupedAliases = useMemo(() => {
    const groups: Record<string, MudAlias[]> = { '__ungrouped__': [] };
    classes.forEach(c => { groups[c.id] = []; });
    
    filteredAliases.forEach(alias => {
      const groupId = alias.classId || '__ungrouped__';
      if (!groups[groupId]) groups[groupId] = [];
      groups[groupId].push(alias);
    });
    
    return groups;
  }, [filteredAliases, classes]);

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
                    value={newAlias.classId || '__none__'}
                    onValueChange={(val) => setNewAlias({ ...newAlias, classId: val === '__none__' ? undefined : val })}
                  >
                    <SelectTrigger data-testid="select-alias-class">
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
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Aliases ({aliases.length})
                </h3>
                <Button
                  variant={selectMode ? "default" : "outline"}
                  size="sm"
                  onClick={toggleSelectMode}
                  data-testid="button-select-mode-aliases"
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
                        <Button variant="ghost" size="sm" onClick={selectAll} data-testid="button-select-all-aliases">
                          Select All
                        </Button>
                        <Button variant="ghost" size="sm" onClick={deselectAll} data-testid="button-deselect-all-aliases">
                          Clear
                        </Button>
                      </div>
                    </div>
                    {selectedIds.size > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <Button variant="destructive" size="sm" onClick={deleteSelected} data-testid="button-delete-selected-aliases">
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => toggleSelectedActive(true)} data-testid="button-enable-selected-aliases">
                          Enable
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => toggleSelectedActive(false)} data-testid="button-disable-selected-aliases">
                          Disable
                        </Button>
                        <Select onValueChange={(val) => moveSelectedToClass(val === '__none__' ? undefined : val)}>
                          <SelectTrigger className="w-[140px] h-8" data-testid="select-move-aliases-class">
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
                  placeholder="Search aliases..."
                  className="pl-9"
                  data-testid="input-search-aliases"
                />
              </div>
              
              {groupedAliases['__ungrouped__']?.length > 0 && (
                <Collapsible open={!collapsedGroups.has('__ungrouped__')} onOpenChange={() => toggleGroup('__ungrouped__')}>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover-elevate rounded-md">
                    {collapsedGroups.has('__ungrouped__') ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    <Folder className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Ungrouped</span>
                    <Badge variant="secondary" className="ml-auto">{groupedAliases['__ungrouped__'].length}</Badge>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-2 ml-6">
                    {groupedAliases['__ungrouped__'].map((alias) => (
                      <AliasCard
                        key={alias.id}
                        alias={alias}
                        classes={classes}
                        editingId={editingId}
                        setEditingId={setEditingId}
                        updateAlias={updateAlias}
                        deleteAlias={deleteAlias}
                        toggleAlias={toggleAlias}
                        openWizardFor={openWizardFor}
                        selectMode={selectMode}
                        isSelected={selectedIds.has(alias.id)}
                        onSelectToggle={toggleSelection}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {classes.map(cls => {
                const clsAliases = groupedAliases[cls.id] || [];
                if (clsAliases.length === 0) return null;
                
                return (
                  <Collapsible key={cls.id} open={!collapsedGroups.has(cls.id)} onOpenChange={() => toggleGroup(cls.id)}>
                    <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover-elevate rounded-md">
                      {collapsedGroups.has(cls.id) ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      <FolderOpen className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">{cls.name}</span>
                      <Badge variant={cls.active ? "default" : "secondary"} className="ml-auto">
                        {clsAliases.length}
                      </Badge>
                      {!cls.active && <Badge variant="outline" className="text-xs">Disabled</Badge>}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 mt-2 ml-6">
                      {clsAliases.map((alias) => (
                        <AliasCard
                          key={alias.id}
                          alias={alias}
                          classes={classes}
                          editingId={editingId}
                          setEditingId={setEditingId}
                          updateAlias={updateAlias}
                          deleteAlias={deleteAlias}
                          toggleAlias={toggleAlias}
                          openWizardFor={openWizardFor}
                          selectMode={selectMode}
                          isSelected={selectedIds.has(alias.id)}
                          onSelectToggle={toggleSelection}
                        />
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}

              {filteredAliases.length === 0 && searchQuery && (
                <div className="text-center text-muted-foreground py-4 text-sm">
                  No aliases match "{searchQuery}"
                </div>
              )}
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
