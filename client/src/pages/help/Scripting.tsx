import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpLayout } from "@/components/HelpLayout";

export default function Scripting() {
  return (
    <HelpLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Lua Scripting</h2>
          <p className="text-muted-foreground">
            Write Lua scripts to automate your MUD experience. Mudscape uses Lua 5.4 via WebAssembly.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Communication Functions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold font-mono">send(command)</h4>
              <p className="text-sm text-muted-foreground">Send a command to the MUD server.</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">send("kill goblin")</pre>
            </div>
            <div>
              <h4 className="font-semibold font-mono">echo(text)</h4>
              <p className="text-sm text-muted-foreground">Display text locally (not sent to MUD).</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">echo("Auto-heal triggered!")</pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Variable Functions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold font-mono">setVariable(name, value)</h4>
              <p className="text-sm text-muted-foreground">Store a persistent value.</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">setVariable("target", "dragon")</pre>
            </div>
            <div>
              <h4 className="font-semibold font-mono">getVariable(name)</h4>
              <p className="text-sm text-muted-foreground">Retrieve a stored value.</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">local target = getVariable("target")</pre>
            </div>
            <p className="text-sm text-muted-foreground">
              Variables are automatically saved to your profile and persist across sessions.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sound Functions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold font-mono">playSound(name, volume, loop)</h4>
              <p className="text-sm text-muted-foreground">Play a sound from the active soundpack.</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">playSound("sword", 0.8, false)</pre>
            </div>
            <div>
              <h4 className="font-semibold font-mono">stopSound(name)</h4>
              <p className="text-sm text-muted-foreground">Stop a playing sound.</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">stopSound("background")</pre>
            </div>
            <div>
              <h4 className="font-semibold font-mono">loopSound(name, volume)</h4>
              <p className="text-sm text-muted-foreground">Play a sound on repeat.</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">loopSound("rain", 0.5)</pre>
            </div>
            <div>
              <h4 className="font-semibold font-mono">setSoundPosition(name, x, y, z)</h4>
              <p className="text-sm text-muted-foreground">Position a sound in 3D space.</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">setSoundPosition("footsteps", 2, 0, -3)</pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Special Variables</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3">In triggers and aliases, these variables capture matched text:</p>
            <table className="w-full">
              <tbody className="divide-y">
                <tr>
                  <td className="py-2 pr-4 font-mono text-sm">matches[1]</td>
                  <td className="py-2">Full matched text</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-sm">matches[2], matches[3], ...</td>
                  <td className="py-2">Capture groups from regex</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-sm">line</td>
                  <td className="py-2">The full line that triggered</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Example Scripts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold">Auto-heal when HP is low:</h4>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`-- Trigger pattern: HP: (\\d+)/(\\d+)
local current = tonumber(matches[2])
local max = tonumber(matches[3])
if current < max * 0.5 then
  send("cast heal self")
  echo("Auto-healing triggered!")
  playSound("heal", 0.8)
end`}
              </pre>
            </div>
            <div>
              <h4 className="font-semibold">Track and attack a target:</h4>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`-- Alias pattern: ^t (.+)$
local target = matches[2]
setVariable("target", target)
send("kill " .. target)
echo("Targeting: " .. target)`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </HelpLayout>
  );
}
