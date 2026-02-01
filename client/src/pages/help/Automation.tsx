import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpLayout } from "@/components/HelpLayout";

export default function Automation() {
  return (
    <HelpLayout>
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
            <h4 className="font-semibold mt-4">Pattern Types</h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Substring</strong> - Simple text matching (faster, simpler)</li>
              <li><strong>Regex</strong> - Pattern matching with capture groups (more powerful)</li>
            </ul>
            <h4 className="font-semibold mt-4">Creating a Trigger</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open the Triggers panel from the Play toolbar</li>
              <li>Click "Add Trigger"</li>
              <li>Enter a pattern to match</li>
              <li>Enter a command or Lua script to execute</li>
              <li>Save the trigger</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trigger Examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold">Auto-loot on kill:</h4>
              <p className="text-sm text-muted-foreground">Pattern (substring): "You have slain"</p>
              <p className="text-sm text-muted-foreground">Command: get all corpse</p>
            </div>
            <div>
              <h4 className="font-semibold">Auto-heal (with Lua):</h4>
              <p className="text-sm text-muted-foreground">Pattern (regex): HP: (\d+)/(\d+)</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">
{`local hp = tonumber(matches[2])
if hp < 50 then
  send("cast heal")
end`}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aliases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              Aliases expand short commands into longer ones before sending to the MUD.
            </p>
            <h4 className="font-semibold mt-4">Simple Substitution</h4>
            <p className="text-sm">
              Pattern: <code className="bg-muted px-1 rounded">^kk$</code><br />
              Command: <code className="bg-muted px-1 rounded">kill kobold</code>
            </p>
            <h4 className="font-semibold mt-4">With Arguments</h4>
            <p className="text-sm">
              Pattern: <code className="bg-muted px-1 rounded">^k (.+)$</code><br />
              Command: <code className="bg-muted px-1 rounded">kill $1</code>
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
            <h4 className="font-semibold mt-4">Timer Types</h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>One-shot</strong> - Executes once after the delay</li>
              <li><strong>Repeating</strong> - Executes repeatedly at the interval</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              Useful for periodic actions like checking stats, sending keep-alive commands, 
              or scheduling healing spells.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Classes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              Group related triggers, aliases, timers, keybindings, and buttons into classes.
              Toggle an entire class on/off with one click.
            </p>
            <h4 className="font-semibold mt-4">Use Cases</h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Combat</strong> - All your fighting automation</li>
              <li><strong>Crafting</strong> - Scripts for crafting activities</li>
              <li><strong>Exploration</strong> - Mapping and navigation helpers</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              Create clickable on-screen buttons for quick commands or Lua scripts.
            </p>
            <p className="text-sm text-muted-foreground">
              Buttons appear in the Play screen toolbar and can be clicked 
              to execute their associated action.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Commands</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>Toggle automation on or off while playing:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><code className="bg-muted px-1 rounded">/config triggers on|off</code> - Toggle trigger processing</li>
              <li><code className="bg-muted px-1 rounded">/config aliases on|off</code> - Toggle alias expansion</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              The command prefix (default <code className="bg-muted px-1 rounded">/</code>) can be customized in Settings.
            </p>
          </CardContent>
        </Card>
      </div>
    </HelpLayout>
  );
}
