import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpLayout } from "@/components/HelpLayout";

export default function Commands() {
  return (
    <HelpLayout>
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
            <CardTitle>Display Commands</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <tbody className="divide-y">
                <tr>
                  <td className="py-2 pr-4 font-mono text-sm">/reader on|off</td>
                  <td className="py-2">Toggle reader mode (queue speech)</td>
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
              <pre className="bg-muted p-2 rounded text-sm mt-1">/rate 1.5</pre>
            </div>
            <div>
              <h4 className="font-semibold">Setting volume to 80%:</h4>
              <pre className="bg-muted p-2 rounded text-sm mt-1">/volume 80</pre>
            </div>
            <div>
              <h4 className="font-semibold">Switching to voice #3:</h4>
              <pre className="bg-muted p-2 rounded text-sm mt-1">/voice 3</pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </HelpLayout>
  );
}
