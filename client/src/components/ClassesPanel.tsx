import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Layers, Plus, Trash2, Save } from 'lucide-react';
import type { MudClass } from '@shared/schema';

interface ClassesPanelProps {
  classes: MudClass[];
  onUpdate: (classes: MudClass[]) => void;
}

export function ClassesPanel({ classes, onUpdate }: ClassesPanelProps) {
  const [localClasses, setLocalClasses] = useState<MudClass[]>([...classes]);
  const [newName, setNewName] = useState('');
  const [open, setOpen] = useState(false);

  const handleAdd = () => {
    if (!newName.trim()) return;
    
    const newClass: MudClass = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      active: true,
    };
    
    setLocalClasses(prev => [...prev, newClass]);
    setNewName('');
  };

  const handleToggle = (id: string, active: boolean) => {
    setLocalClasses(prev => 
      prev.map(c => c.id === id ? { ...c, active } : c)
    );
  };

  const handleDelete = (id: string) => {
    setLocalClasses(prev => prev.filter(c => c.id !== id));
  };

  const handleSave = () => {
    onUpdate(localClasses);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-classes-panel">
          <Layers className="w-4 h-4 mr-2" />
          Classes ({classes.length})
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Trigger/Alias Classes
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Classes let you group triggers and aliases together. Disable a class to disable all items in it.
          </p>
          
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="class-name" className="sr-only">Class Name</Label>
              <Input
                id="class-name"
                placeholder="New class name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                data-testid="input-class-name"
              />
            </div>
            <Button size="icon" onClick={handleAdd} data-testid="button-add-class">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {localClasses.map((cls) => (
                <div 
                  key={cls.id} 
                  className="flex items-center justify-between p-3 rounded-md border border-border bg-card"
                  data-testid={`class-item-${cls.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={cls.active}
                      onCheckedChange={(active) => handleToggle(cls.id, active)}
                      aria-label={`Toggle ${cls.name}`}
                    />
                    <span className={`font-medium ${!cls.active ? 'text-muted-foreground line-through' : ''}`}>
                      {cls.name}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(cls.id)}
                    data-testid={`button-delete-class-${cls.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
              
              {localClasses.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No classes defined. Create a class to organize triggers and aliases.
                </div>
              )}
            </div>
          </ScrollArea>
          
          <Button className="w-full" onClick={handleSave} data-testid="button-save-classes">
            <Save className="w-4 h-4 mr-2" />
            Save Classes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
