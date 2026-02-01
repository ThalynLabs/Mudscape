import { Button } from "@/components/ui/button";
import { X, Plus, Wifi, WifiOff } from "lucide-react";
import { ConnectionTab } from "@/lib/connection-manager";
import { cn } from "@/lib/utils";

interface ConnectionTabsProps {
  tabs: ConnectionTab[];
  activeTabId: string | null;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onAddTab: () => void;
}

export function ConnectionTabs({ tabs, activeTabId, onSelectTab, onCloseTab, onAddTab }: ConnectionTabsProps) {
  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-muted/30 border-b border-border overflow-x-auto" role="tablist">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tab"
          aria-selected={tab.id === activeTabId}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-t-md text-sm cursor-pointer transition-colors group",
            tab.id === activeTabId
              ? "bg-background border border-b-0 border-border"
              : "hover:bg-muted/50"
          )}
          onClick={() => onSelectTab(tab.id)}
          data-testid={`tab-${tab.profileId}`}
        >
          {tab.isConnected ? (
            <Wifi className="w-3 h-3 text-green-500" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-500" />
          )}
          <span className="max-w-32 truncate">{tab.profileName}</span>
          {tab.unreadCount > 0 && tab.id !== activeTabId && (
            <span className="bg-primary text-primary-foreground text-xs px-1.5 rounded-full">
              {tab.unreadCount > 99 ? "99+" : tab.unreadCount}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onCloseTab(tab.id);
            }}
            data-testid={`close-tab-${tab.profileId}`}
          >
            <X className="w-3 h-3" />
            <span className="sr-only">Close {tab.profileName}</span>
          </Button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="icon"
        className="w-7 h-7 shrink-0"
        onClick={onAddTab}
        data-testid="button-add-connection"
      >
        <Plus className="w-4 h-4" />
        <span className="sr-only">Add connection</span>
      </Button>
    </div>
  );
}
