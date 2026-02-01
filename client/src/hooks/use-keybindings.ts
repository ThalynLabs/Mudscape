import { useEffect, useCallback } from 'react';
import type { MudKeybinding } from '@shared/schema';
import { parseKeyCombo } from '@/lib/text-utils';

interface UseKeybindingsOptions {
  keybindings: MudKeybinding[];
  onSend: (command: string) => void;
  onExecuteScript: (script: string) => void;
  isClassActive?: (classId?: string) => boolean;
  enabled?: boolean;
}

export function useKeybindings({
  keybindings,
  onSend,
  onExecuteScript,
  isClassActive,
  enabled = true
}: UseKeybindingsOptions) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    const pressedCombo = parseKeyCombo(event);
    
    const binding = keybindings.find(
      (kb) => kb.active && 
              kb.key.toLowerCase() === pressedCombo.toLowerCase() &&
              (!isClassActive || isClassActive(kb.classId))
    );

    if (binding) {
      event.preventDefault();
      event.stopPropagation();

      if (binding.isScript) {
        try {
          onExecuteScript(binding.command);
        } catch (err) {
          console.error(`Keybinding script error:`, err);
        }
      } else {
        onSend(binding.command);
      }
    }
  }, [keybindings, onSend, onExecuteScript, isClassActive, enabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
