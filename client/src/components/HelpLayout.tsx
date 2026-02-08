import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, 
  Volume2, 
  Terminal, 
  Keyboard, 
  Zap, 
  Settings, 
  MessageSquare,
  Music,
  Package,
  Bot,
  BookOpen,
  Import
} from "lucide-react";

const sections = [
  { id: "getting-started", label: "Getting Started", icon: Terminal, path: "/help" },
  { id: "speech", label: "Speech & TTS", icon: Volume2, path: "/help/speech" },
  { id: "keyboard", label: "Keyboard Shortcuts", icon: Keyboard, path: "/help/keyboard" },
  { id: "commands", label: "Client Commands", icon: MessageSquare, path: "/help/commands" },
  { id: "scripting", label: "Lua Scripting", icon: Zap, path: "/help/scripting" },
  { id: "automation", label: "Triggers & Aliases", icon: BookOpen, path: "/help/automation" },
  { id: "sounds", label: "Sound System", icon: Music, path: "/help/sounds" },
  { id: "packages", label: "Package Manager", icon: Package, path: "/help/packages" },
  { id: "importing", label: "Importing from Other Clients", icon: Import, path: "/help/importing" },
  { id: "ai-assistant", label: "AI Script Assistant", icon: Bot, path: "/help/ai-assistant" },
  { id: "settings", label: "Settings", icon: Settings, path: "/help/settings" },
];

interface HelpLayoutProps {
  children: React.ReactNode;
}

export function HelpLayout({ children }: HelpLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen bg-background" data-testid="help-page">
      <div className="flex flex-col w-64 border-r bg-muted/30">
        <div className="p-4 border-b">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-xl font-bold mt-4">Mudscape Help</h1>
          <p className="text-sm text-muted-foreground">User Guide & Documentation</p>
        </div>
        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-1">
            {sections.map((section) => {
              const isActive = location === section.path || 
                (section.path === "/help" && location === "/help");
              return (
                <Link key={section.id} href={section.path}>
                  <button
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover-elevate"
                    }`}
                    data-testid={`nav-${section.id}`}
                  >
                    <section.icon className="h-4 w-4" />
                    {section.label}
                  </button>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="max-w-3xl mx-auto p-8">
            {children}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
