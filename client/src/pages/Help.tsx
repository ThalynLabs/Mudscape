import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Bot
} from "lucide-react";

export default function Help() {
  const [activeSection, setActiveSection] = useState("getting-started");

  const sections = [
    { id: "getting-started", label: "Getting Started", icon: Terminal },
    { id: "speech", label: "Speech & TTS", icon: Volume2 },
    { id: "keyboard", label: "Keyboard Shortcuts", icon: Keyboard },
    { id: "commands", label: "Client Commands", icon: MessageSquare },
    { id: "scripting", label: "Lua Scripting", icon: Zap },
    { id: "automation", label: "Triggers & Aliases", icon: Zap },
    { id: "sounds", label: "Sound System", icon: Music },
    { id: "packages", label: "Package Manager", icon: Package },
    { id: "ai-assistant", label: "AI Script Assistant", icon: Bot },
    { id: "settings", label: "Settings", icon: Settings },
  ];

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
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  activeSection === section.id
                    ? "bg-primary text-primary-foreground"
                    : "hover-elevate"
                }`}
                data-testid={`nav-${section.id}`}
              >
                <section.icon className="h-4 w-4" />
                {section.label}
              </button>
            ))}
          </nav>
        </ScrollArea>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="max-w-3xl mx-auto p-8">
            {activeSection === "getting-started" && <GettingStartedSection />}
            {activeSection === "speech" && <SpeechSection />}
            {activeSection === "keyboard" && <KeyboardSection />}
            {activeSection === "commands" && <CommandsSection />}
            {activeSection === "scripting" && <ScriptingSection />}
            {activeSection === "automation" && <AutomationSection />}
            {activeSection === "sounds" && <SoundsSection />}
            {activeSection === "packages" && <PackagesSection />}
            {activeSection === "ai-assistant" && <AIAssistantSection />}
            {activeSection === "settings" && <SettingsSection />}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function GettingStartedSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Getting Started with Mudscape</h2>
        <p className="text-muted-foreground">
          Welcome to Mudscape, an accessibility-first MUD client designed for screen reader users.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What is a MUD?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            A MUD (Multi-User Dungeon) is a text-based multiplayer game where you explore worlds, 
            complete quests, and interact with other players - all through text commands.
          </p>
          <p>
            Mudscape connects you to MUD servers and provides features like text-to-speech, 
            automation scripting, and sound effects to enhance your experience.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Creating Your First Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ol className="list-decimal list-inside space-y-2">
            <li>From the home screen, click "New Profile"</li>
            <li>Enter a name for this MUD connection</li>
            <li>Enter the MUD server address (host) and port</li>
            <li>Optionally add your character name and password for auto-login</li>
            <li>Click "Save" to create the profile</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connecting to a MUD</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            Click "Connect" on any profile to open the play screen and connect to the MUD server.
          </p>
          <p>
            Once connected, type commands in the input box at the bottom and press Enter to send them.
            The MUD's responses appear in the terminal above.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2">
            <li>Type <code className="bg-muted px-1 rounded">/help</code> while playing for quick command reference</li>
            <li>Press <kbd className="bg-muted px-2 py-0.5 rounded text-sm">F1</kbd> anytime to open this help</li>
            <li>Use <kbd className="bg-muted px-2 py-0.5 rounded text-sm">Ctrl+1-9</kbd> to re-read recent lines</li>
            <li>Commands starting with <code className="bg-muted px-1 rounded">/</code> are Mudscape commands, not sent to the MUD</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function SpeechSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Speech & Text-to-Speech</h2>
        <p className="text-muted-foreground">
          Mudscape uses your browser's built-in speech synthesis to read MUD output aloud.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enabling Speech</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>Speech can be toggled in several ways:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Type <code className="bg-muted px-1 rounded">/speech on</code> or <code className="bg-muted px-1 rounded">/speech off</code></li>
            <li>Go to Settings and toggle "Enable Speech"</li>
            <li>Configure per-profile in Per-MUD Settings</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adjusting Voice Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>Fine-tune speech while playing:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><code className="bg-muted px-1 rounded">/rate 1.5</code> - Speed (0.5 to 2.0)</li>
            <li><code className="bg-muted px-1 rounded">/volume 80</code> - Volume (0 to 100)</li>
            <li><code className="bg-muted px-1 rounded">/pitch 1.0</code> - Pitch (0.5 to 2.0)</li>
            <li><code className="bg-muted px-1 rounded">/voice</code> - List available voices</li>
            <li><code className="bg-muted px-1 rounded">/voice 3</code> - Select voice #3</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Speech Interruption</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>Control when speech stops automatically:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>On Keypress</strong> - Speech stops when you start typing</li>
            <li><strong>On Send</strong> - Speech stops when you press Enter</li>
            <li><strong>On Incoming</strong> - Speech stops when new text arrives</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-2">
            Configure these in Settings under the Speech category.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reader Mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            Reader mode queues incoming text instead of speaking immediately. 
            Press Enter (even with an empty input) to hear the next queued message.
          </p>
          <p>
            Enable with <code className="bg-muted px-1 rounded">/reader on</code> or in Settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function KeyboardSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Keyboard Shortcuts</h2>
        <p className="text-muted-foreground">
          Quick keyboard access to common features while playing.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Speech Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <tbody className="divide-y">
              <tr>
                <td className="py-2 pr-4"><kbd className="bg-muted px-2 py-0.5 rounded text-sm">Ctrl+1</kbd> through <kbd className="bg-muted px-2 py-0.5 rounded text-sm">Ctrl+9</kbd></td>
                <td className="py-2">Read the 1st through 9th most recent line</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><kbd className="bg-muted px-2 py-0.5 rounded text-sm">Ctrl</kbd> (press alone)</td>
                <td className="py-2">Pause/resume speech</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Navigation</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <tbody className="divide-y">
              <tr>
                <td className="py-2 pr-4"><kbd className="bg-muted px-2 py-0.5 rounded text-sm">F1</kbd></td>
                <td className="py-2">Open this help wiki</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><kbd className="bg-muted px-2 py-0.5 rounded text-sm">Up Arrow</kbd></td>
                <td className="py-2">Previous command in history</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><kbd className="bg-muted px-2 py-0.5 rounded text-sm">Down Arrow</kbd></td>
                <td className="py-2">Next command in history</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><kbd className="bg-muted px-2 py-0.5 rounded text-sm">Escape</kbd></td>
                <td className="py-2">Clear input / Close dialogs</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Keybindings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            Create your own keyboard shortcuts in the Keybindings panel (accessible from the Play screen toolbar).
          </p>
          <p>
            Keybindings can send commands or execute Lua scripts.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function CommandsSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Client Commands</h2>
        <p className="text-muted-foreground">
          Commands starting with <code className="bg-muted px-1 rounded">/</code> are handled by Mudscape, 
          not sent to the MUD server.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Speech Commands</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <tbody className="divide-y">
              <tr>
                <td className="py-2 pr-4 font-mono text-sm">/speech on|off</td>
                <td className="py-2">Toggle text-to-speech</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono text-sm">/rate &lt;0.5-2&gt;</td>
                <td className="py-2">Set speech rate</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono text-sm">/volume &lt;0-100&gt;</td>
                <td className="py-2">Set speech volume</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono text-sm">/pitch &lt;0.5-2&gt;</td>
                <td className="py-2">Set speech pitch</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono text-sm">/voice</td>
                <td className="py-2">List available voices</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono text-sm">/voice &lt;number&gt;</td>
                <td className="py-2">Select a voice by number</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Automation Commands</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <tbody className="divide-y">
              <tr>
                <td className="py-2 pr-4 font-mono text-sm">/triggers on|off</td>
                <td className="py-2">Toggle trigger processing</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono text-sm">/aliases on|off</td>
                <td className="py-2">Toggle alias expansion</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Other Commands</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <tbody className="divide-y">
              <tr>
                <td className="py-2 pr-4 font-mono text-sm">/help</td>
                <td className="py-2">Show quick help in terminal</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono text-sm">/settings</td>
                <td className="py-2">Open settings panel</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono text-sm">/reader on|off</td>
                <td className="py-2">Toggle reader mode</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function ScriptingSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Lua Scripting</h2>
        <p className="text-muted-foreground">
          Write Lua scripts to automate your MUD experience.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Functions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold">Communication</h4>
            <ul className="list-disc list-inside space-y-1 text-sm mt-1">
              <li><code className="bg-muted px-1 rounded">send(command)</code> - Send a command to the MUD</li>
              <li><code className="bg-muted px-1 rounded">echo(text)</code> - Display text locally (not sent)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Variables</h4>
            <ul className="list-disc list-inside space-y-1 text-sm mt-1">
              <li><code className="bg-muted px-1 rounded">setVariable(name, value)</code> - Store a value</li>
              <li><code className="bg-muted px-1 rounded">getVariable(name)</code> - Retrieve a value</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Sound</h4>
            <ul className="list-disc list-inside space-y-1 text-sm mt-1">
              <li><code className="bg-muted px-1 rounded">playSound(name, volume, loop)</code> - Play a sound</li>
              <li><code className="bg-muted px-1 rounded">stopSound(name)</code> - Stop a sound</li>
              <li><code className="bg-muted px-1 rounded">loopSound(name, volume)</code> - Loop a sound</li>
              <li><code className="bg-muted px-1 rounded">setSoundPosition(name, x, y, z)</code> - 3D position</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Special Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3">In triggers and aliases, these capture matched text:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><code className="bg-muted px-1 rounded">matches[1]</code> - Full matched text</li>
            <li><code className="bg-muted px-1 rounded">matches[2]</code>, <code className="bg-muted px-1 rounded">matches[3]</code>, etc. - Capture groups</li>
            <li><code className="bg-muted px-1 rounded">line</code> - The full line that triggered</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Example Script</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`-- Auto-heal when HP is low
if matches[2] then
  local hp = tonumber(matches[2])
  if hp < 50 then
    send("cast heal self")
    echo("Auto-healing triggered!")
    playSound("heal", 0.8)
  end
end`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

function AutomationSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Triggers & Aliases</h2>
        <p className="text-muted-foreground">
          Automate repetitive tasks and create command shortcuts.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Triggers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            Triggers watch incoming MUD text and execute actions when patterns match.
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Substring</strong> - Simple text matching</li>
            <li><strong>Regex</strong> - Pattern matching with capture groups</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-2">
            Triggers can send commands or execute Lua scripts.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aliases</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            Aliases expand short commands into longer ones before sending.
          </p>
          <p className="text-sm">
            Example: Typing <code className="bg-muted px-1 rounded">kk</code> could expand 
            to <code className="bg-muted px-1 rounded">kill kobold</code>
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Use <code className="bg-muted px-1 rounded">$1</code>, <code className="bg-muted px-1 rounded">$2</code>, 
            etc. for captured arguments.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            Execute Lua scripts on a schedule - once after a delay, or repeatedly.
          </p>
          <p className="text-sm text-muted-foreground">
            Useful for periodic actions like checking stats or sending keep-alive commands.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Classes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            Group related triggers, aliases, and other automation into classes.
            Toggle an entire class on/off with one click.
          </p>
          <p className="text-sm text-muted-foreground">
            Example: Create a "Combat" class with all your fighting automation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SoundsSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Sound System</h2>
        <p className="text-muted-foreground">
          Mudscape supports sounds via soundpacks and the MSP protocol.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Soundpacks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            Upload sound files and organize them into soundpacks. 
            Select an active soundpack for each profile.
          </p>
          <p className="text-sm text-muted-foreground">
            Access the Soundpack Manager from the Play screen toolbar.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>MSP Protocol</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            Mudscape automatically parses MSP (MUD Sound Protocol) triggers:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><code className="bg-muted px-1 rounded">!!SOUND(name vol=50 loop=-1)</code></li>
            <li><code className="bg-muted px-1 rounded">!!MUSIC(name vol=50)</code></li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spatial Audio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            Position sounds in 3D space using HRTF (Head-Related Transfer Function):
          </p>
          <pre className="bg-muted p-3 rounded text-sm mt-2">
{`setSoundPosition("footsteps", 2, 0, -3)
-- x: left/right, y: up/down, z: front/back`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

function PackagesSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Package Manager</h2>
        <p className="text-muted-foreground">
          Share and reuse automation bundles across profiles.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Creating Packages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            Bundle your triggers, aliases, timers, keybindings, buttons, and classes 
            into a shareable package.
          </p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Open the Package Manager from the Play toolbar</li>
            <li>Click "Create Package"</li>
            <li>Select which items to include</li>
            <li>Download as a <code className="bg-muted px-1 rounded">.mudpack.json</code> file</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Installing Packages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ol className="list-decimal list-inside space-y-1">
            <li>Import a <code className="bg-muted px-1 rounded">.mudpack.json</code> file</li>
            <li>Package appears in your library</li>
            <li>Click "Install" to apply to current profile</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

function AIAssistantSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">AI Script Assistant</h2>
        <p className="text-muted-foreground">
          Generate Lua automation scripts using natural language.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            The AI Script Assistant requires your own OpenAI API key.
          </p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Get an API key from <a href="https://platform.openai.com" className="text-primary hover:underline" target="_blank" rel="noopener">OpenAI</a></li>
            <li>Go to Settings and enter your key in the AI tab</li>
            <li>Choose storage method: local or encrypted</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Using the Assistant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            Click the wand icon in the Play toolbar to open the Script Assistant.
          </p>
          <p>
            Describe what you want in plain language:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>"Create a trigger that heals me when HP drops below 50"</li>
            <li>"Make an alias 'ga' that casts greater armor on myself"</li>
            <li>"Add a timer that sends 'look' every 30 seconds"</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-2">
            The AI generates ready-to-use triggers, aliases, timers, or buttons.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Settings</h2>
        <p className="text-muted-foreground">
          Configure global defaults and per-MUD preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Global Defaults</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            Settings that apply to all MUD connections by default.
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Speech</strong> - TTS settings, rate, volume, pitch, voice</li>
            <li><strong>Display</strong> - Font size, reader mode, strip symbols</li>
            <li><strong>Automation</strong> - Enable/disable triggers and aliases</li>
            <li><strong>Connection</strong> - Auto-reconnect, keep-alive, GMCP</li>
            <li><strong>AI</strong> - OpenAI API key for Script Assistant</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Per-MUD Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            Override global defaults for specific MUD profiles.
          </p>
          <p className="text-sm">
            Settings with a colored indicator are customized for that profile.
            Click "Reset" to revert to the global default.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>In-Game Adjustments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            Adjust settings while playing without opening the Settings page:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Use <code className="bg-muted px-1 rounded">/speech</code>, <code className="bg-muted px-1 rounded">/rate</code>, <code className="bg-muted px-1 rounded">/volume</code> commands</li>
            <li>Type <code className="bg-muted px-1 rounded">/settings</code> to open the settings panel</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
