import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpLayout } from "@/components/HelpLayout";

export default function Commands() {
  return (
    <HelpLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Client Commands</h2>
          <p className="text-muted-foreground">
            All client commands use the format <code className="bg-muted px-1 rounded">/config feature option</code>.
            The prefix (default <code className="bg-muted px-1 rounded">/</code>) can be customized in Settings.
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
                  <td className="py-2 pr-4 font-mono text-sm">/config speech on|off</td>
                  <td className="py-2">Toggle text-to-speech</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-sm">/config rate &lt;0.5-2&gt;</td>
                  <td className="py-2">Set speech rate</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-sm">/config volume &lt;0-100&gt;</td>
                  <td className="py-2">Set speech volume</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-sm">/config pitch &lt;0.5-2&gt;</td>
                  <td className="py-2">Set speech pitch</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-sm">/config voice</td>
                  <td className="py-2">List available voices</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-sm">/config voice &lt;number&gt;</td>
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
                  <td className="py-2 pr-4 font-mono text-sm">/config triggers on|off</td>
                  <td className="py-2">Toggle trigger processing</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-sm">/config aliases on|off</td>
                  <td className="py-2">Toggle alias expansion</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Display Commands</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <tbody className="divide-y">
                <tr>
                  <td className="py-2 pr-4 font-mono text-sm">/config reader on|off</td>
                  <td className="py-2">Toggle reader mode (queue speech)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-sm">/config keep on|off</td>
                  <td className="py-2">Keep input after pressing Enter (use Escape to clear)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-sm">/config screenreader on|off</td>
                  <td className="py-2">NVDA/JAWS auto-speak via ARIA (aliases: sr, nvda, jaws)</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Commands</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <tbody className="divide-y">
                <tr>
                  <td className="py-2 pr-4 font-mono text-sm">/help</td>
                  <td className="py-2">Show quick help in terminal</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-sm">/config settings</td>
                  <td className="py-2">Open settings panel</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-sm">/config prefix &lt;char&gt;</td>
                  <td className="py-2">Change command prefix (e.g., # instead of /)</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Command Examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold">Adjusting speech speed:</h4>
              <pre className="bg-muted p-2 rounded text-sm mt-1">/config rate 1.5</pre>
            </div>
            <div>
              <h4 className="font-semibold">Setting volume to 80%:</h4>
              <pre className="bg-muted p-2 rounded text-sm mt-1">/config volume 80</pre>
            </div>
            <div>
              <h4 className="font-semibold">Switching to voice #3:</h4>
              <pre className="bg-muted p-2 rounded text-sm mt-1">/config voice 3</pre>
            </div>
            <div>
              <h4 className="font-semibold">Changing command prefix to #:</h4>
              <pre className="bg-muted p-2 rounded text-sm mt-1">/config prefix #</pre>
              <p className="text-sm text-muted-foreground mt-1">After this, use <code className="bg-muted px-1 rounded">#config speech on</code> instead.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custom Prefix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              You can change the command prefix from <code className="bg-muted px-1 rounded">/</code> to any single character.
              This is useful if your MUD uses <code className="bg-muted px-1 rounded">/</code> for its own commands.
            </p>
            <p>
              Change it via:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>In-game: <code className="bg-muted px-1 rounded">/config prefix #</code></li>
              <li>Settings page: Automation → Command Prefix</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </HelpLayout>
  );
}
