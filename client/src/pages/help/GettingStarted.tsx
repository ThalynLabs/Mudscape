import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpLayout } from "@/components/HelpLayout";

export default function GettingStarted() {
  return (
    <HelpLayout>
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
              <li>Configure settings with <code className="bg-muted px-1 rounded">/config</code> commands (e.g., <code className="bg-muted px-1 rounded">/config speech on</code>)</li>
              <li>The command prefix can be changed via <code className="bg-muted px-1 rounded">/config prefix #</code> if your MUD uses <code className="bg-muted px-1 rounded">/</code></li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Auto-Connect & Auto-Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              You can configure profiles to automatically connect when the app starts 
              and automatically log in to your character.
            </p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Edit your profile settings</li>
              <li>Enable "Auto Connect" to connect on app startup</li>
              <li>Enter your character name and password</li>
              <li>Set login commands using placeholders like <code className="bg-muted px-1 rounded">{"{name}"}</code> and <code className="bg-muted px-1 rounded">{"{password}"}</code></li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Multi-MUD Connections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              Connect to multiple MUDs simultaneously and switch between them with tabs.
            </p>
            <h4 className="font-semibold mt-2">Adding Connections</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>With one connection: Click the "+ Add MUD" button in the top bar</li>
              <li>With multiple connections: Click the "+" button in the tab bar</li>
              <li>Select a profile from the list to open in a new tab</li>
            </ul>
            <h4 className="font-semibold mt-3">Switching Between Connections</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Click on any tab to switch to that connection</li>
              <li>Use Arrow Left/Right keys to navigate between tabs</li>
              <li>Each tab shows connection status (green = online, red = offline)</li>
              <li>Unread message count appears on inactive tabs when new lines arrive</li>
            </ul>
            <h4 className="font-semibold mt-3">Closing Connections</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Click the X button on any tab to close that connection</li>
              <li>Press Delete key while focused on a tab to close it</li>
              <li>Use the Disconnect button to disconnect without closing the tab</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>GMCP Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              Mudscape supports GMCP (Generic MUD Communication Protocol) for receiving 
              structured data from MUD servers that support it.
            </p>
            <p className="text-sm text-muted-foreground">
              GMCP provides data like character vitals, room information, and more - 
              enabling richer automation and display options.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Migrating from Mudlet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              Coming from Mudlet? Mudscape can import your existing packages:
            </p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Open the Package Manager while connected</li>
              <li>Click "Import Mudlet Package"</li>
              <li>Select your .mpackage, .zip, or .xml file</li>
              <li>Preview and install the converted automation</li>
            </ol>
            <p className="text-sm text-muted-foreground mt-2">
              Lua scripts are preserved since both clients use Lua.
            </p>
          </CardContent>
        </Card>
      </div>
    </HelpLayout>
  );
}
