import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpLayout } from "@/components/HelpLayout";

export default function SettingsHelp() {
  return (
    <HelpLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Settings</h2>
          <p className="text-muted-foreground">
            Configure global defaults and per-MUD preferences.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Settings Architecture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              Mudscape uses a two-level settings system:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Global Defaults</strong> - Apply to all MUD connections</li>
              <li><strong>Per-MUD Settings</strong> - Override globals for specific profiles</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              If a per-MUD setting is not configured, it inherits the global default.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Global Defaults</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>Settings that apply to all MUD connections by default:</p>
            <div className="mt-4 space-y-3">
              <div>
                <h4 className="font-semibold">Speech</h4>
                <p className="text-sm text-muted-foreground">
                  Enable/disable TTS, speech rate, volume, pitch, voice selection, 
                  and interruption behaviors.
                </p>
              </div>
              <div>
                <h4 className="font-semibold">Display</h4>
                <p className="text-sm text-muted-foreground">
                  Font size, line height, high contrast mode, reader mode, 
                  input echo, strip symbols.
                </p>
              </div>
              <div>
                <h4 className="font-semibold">Automation</h4>
                <p className="text-sm text-muted-foreground">
                  Enable/disable triggers and aliases globally. Customize the command 
                  prefix (default <code className="bg-muted px-1 rounded">/</code>) for 
                  in-game configuration commands.
                </p>
              </div>
              <div>
                <h4 className="font-semibold">Connection</h4>
                <p className="text-sm text-muted-foreground">
                  Auto-reconnect, reconnect delay, keep-alive settings, GMCP support.
                </p>
              </div>
              <div>
                <h4 className="font-semibold">AI</h4>
                <p className="text-sm text-muted-foreground">
                  OpenAI API key for the Script Assistant feature.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Per-MUD Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              Override global defaults for specific MUD profiles. Useful when 
              different MUDs need different configurations.
            </p>
            <h4 className="font-semibold mt-4">Override Indicators</h4>
            <p className="text-sm text-muted-foreground">
              Settings with a colored dot are customized for that profile 
              (different from the global default).
            </p>
            <h4 className="font-semibold mt-4">Resetting to Global</h4>
            <p className="text-sm text-muted-foreground">
              Click the "Reset" button next to a setting to revert it to the 
              global default value.
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
            <table className="w-full mt-2">
              <tbody className="divide-y">
                <tr>
                  <td className="py-2 pr-4 font-mono text-sm">/config settings</td>
                  <td className="py-2">Open the settings panel</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-sm">/config speech on|off</td>
                  <td className="py-2">Toggle speech</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-sm">/config rate, /config volume, /config pitch</td>
                  <td className="py-2">Adjust voice settings</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-sm">/config triggers, /config aliases</td>
                  <td className="py-2">Toggle automation</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-sm">/config prefix &lt;char&gt;</td>
                  <td className="py-2">Change command prefix</td>
                </tr>
              </tbody>
            </table>
            <p className="text-sm text-muted-foreground mt-2">
              Changes made via commands are saved to the current profile's settings.
              The command prefix (default <code className="bg-muted px-1 rounded">/</code>) can be customized.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              In addition to the settings above, each profile has its own:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Connection info</strong> - Host, port, encoding</li>
              <li><strong>Character settings</strong> - Name, password, login commands</li>
              <li><strong>Auto-connect</strong> - Connect on app startup</li>
              <li><strong>Automation items</strong> - Triggers, aliases, timers, etc.</li>
              <li><strong>Variables</strong> - Persistent Lua variables</li>
              <li><strong>Active soundpack</strong> - Selected sound theme</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </HelpLayout>
  );
}
