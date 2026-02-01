import { Button } from "@/components/ui/button";
import { X, Plus, Wifi, WifiOff } from "lucide-react";
import { ConnectionTab } from "@/lib/connection-manager";
import { cn } from "@/lib/utils";
import { useRef, useCallback } from "react";

interface ConnectionTabsProps {
  tabs: ConnectionTab[];
  activeTabId: string | null;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onAddTab: () => void;
}

export function ConnectionTabs({ tabs, activeTabId, onSelectTab, onCloseTab, onAddTab }: ConnectionTabsProps) {
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent, tabId: string, index: number) => {
    let targetIndex = -1;
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        targetIndex = index > 0 ? index - 1 : tabs.length - 1;
        break;
      case 'ArrowRight':
        e.preventDefault();
        targetIndex = index < tabs.length - 1 ? index + 1 : 0;
        break;
      case 'Home':
        e.preventDefault();
        targetIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        targetIndex = tabs.length - 1;
        break;
      case 'Delete':
        e.preventDefault();
        onCloseTab(tabId);
        return;
      default:
        return;
    }
    
    if (targetIndex >= 0 && targetIndex < tabs.length) {
      const targetTab = tabs[targetIndex];
      const targetEl = tabRefs.current.get(targetTab.id);
      targetEl?.focus();
      onSelectTab(targetTab.id);
    }
  }, [tabs, onSelectTab, onCloseTab]);

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div 
      className="flex items-center gap-1 px-2 py-1 bg-muted/30 border-b border-border overflow-x-auto" 
      role="tablist"
      aria-label="MUD connections"
    >
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          ref={(el) => {
            if (el) {
              tabRefs.current.set(tab.id, el);
            } else {
              tabRefs.current.delete(tab.id);
            }
          }}
          type="button"
          role="tab"
          tabIndex={tab.id === activeTabId ? 0 : -1}
          aria-selected={tab.id === activeTabId}
          aria-label={`${tab.profileName}, ${tab.isConnected ? 'connected' : 'disconnected'}${tab.unreadCount > 0 ? `, ${tab.unreadCount} unread` : ''}`}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-t-md text-sm cursor-pointer transition-colors group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
            tab.id === activeTabId
              ? "bg-background border border-b-0 border-border"
              : "hover:bg-muted/50"
          )}
          onClick={() => onSelectTab(tab.id)}
          onKeyDown={(e) => handleKeyDown(e, tab.id, index)}
          data-testid={`tab-${tab.profileId}`}
        >
          {tab.isConnected ? (
            <Wifi className="w-3 h-3 text-green-500" aria-hidden="true" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-500" aria-hidden="true" />
          )}
          <span className="max-w-32 truncate">{tab.profileName}</span>
          {tab.unreadCount > 0 && tab.id !== activeTabId && (
            <span 
              className="bg-primary text-primary-foreground text-xs px-1.5 rounded-full"
              aria-hidden="true"
            >
              {tab.unreadCount > 99 ? "99+" : tab.unreadCount}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="w-5 h-5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onCloseTab(tab.id);
            }}
            tabIndex={-1}
            aria-label={`Close ${tab.profileName}`}
            data-testid={`close-tab-${tab.profileId}`}
          >
            <X className="w-3 h-3" aria-hidden="true" />
          </Button>
        </button>
      ))}
      <Button
        variant="ghost"
        size="icon"
        className="w-7 h-7 shrink-0"
        onClick={onAddTab}
        aria-label="Add new MUD connection"
        data-testid="button-add-connection-tabs"
      >
        <Plus className="w-4 h-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
