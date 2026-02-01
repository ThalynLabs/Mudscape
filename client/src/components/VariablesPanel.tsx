import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Variable, Plus, Trash2, Save } from 'lucide-react';
import type { MudVariables } from '@shared/schema';

interface VariablesPanelProps {
  variables: MudVariables;
  onUpdate: (variables: MudVariables) => void;
}

export function VariablesPanel({ variables, onUpdate }: VariablesPanelProps) {
  const [localVars, setLocalVars] = useState<MudVariables>({ ...variables });
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [open, setOpen] = useState(false);

  const handleAdd = () => {
    if (!newKey.trim()) return;
    
    let parsedValue: string | number | boolean | null = newValue;
    if (newValue === 'true') parsedValue = true;
    else if (newValue === 'false') parsedValue = false;
    else if (newValue === 'null') parsedValue = null;
    else if (!isNaN(Number(newValue)) && newValue.trim() !== '') parsedValue = Number(newValue);
    
    setLocalVars(prev => ({ ...prev, [newKey]: parsedValue }));
    setNewKey('');
    setNewValue('');
  };

  const handleDelete = (key: string) => {
    setLocalVars(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const handleSave = () => {
    onUpdate(localVars);
    setOpen(false);
  };

  const varEntries = Object.entries(localVars);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-variables-panel">
          <Variable className="w-4 h-4 mr-2" />
          Variables ({varEntries.length})
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Variable className="w-5 h-5" />
            Script Variables
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="var-key" className="sr-only">Variable Name</Label>
              <Input
                id="var-key"
                placeholder="Variable name"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                data-testid="input-variable-name"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="var-value" className="sr-only">Value</Label>
              <Input
                id="var-value"
                placeholder="Value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                data-testid="input-variable-value"
              />
            </div>
            <Button size="icon" onClick={handleAdd} data-testid="button-add-variable">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {varEntries.map(([key, value]) => (
                <div 
                  key={key} 
                  className="flex items-center justify-between p-3 rounded-md border border-border bg-card"
                  data-testid={`variable-item-${key}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-medium text-primary">{key}</span>
                    <Badge variant="secondary" className="font-mono">
                      {typeof value === 'string' ? `"${value}"` : String(value)}
                    </Badge>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(key)}
                    data-testid={`button-delete-variable-${key}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
              
              {varEntries.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No variables defined. Variables set in scripts will appear here.
                </div>
              )}
            </div>
          </ScrollArea>
          
          <Button className="w-full" onClick={handleSave} data-testid="button-save-variables">
            <Save className="w-4 h-4 mr-2" />
            Save Variables
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
