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
            <CardTitle>Text Manipulation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground mb-2">
              These functions only work in trigger scripts (not aliases or timers) and affect the current incoming line.
            </p>
            <div>
              <h4 className="font-semibold font-mono">gag()</h4>
              <p className="text-sm text-muted-foreground">Hide the current line from display.</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">gag()  -- Line won't appear in terminal</pre>
            </div>
            <div>
              <h4 className="font-semibold font-mono">replace(old, new)</h4>
              <p className="text-sm text-muted-foreground">Replace text in the current line before display.</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">replace("gold coins", "GOLD!")</pre>
            </div>
            <div>
              <h4 className="font-semibold font-mono">print(text)</h4>
              <p className="text-sm text-muted-foreground">Debug output (displayed with [debug] prefix).</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">print("Current HP: " .. hp)</pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dynamic Automation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold font-mono">tempTrigger(pattern, script, timeout)</h4>
              <p className="text-sm text-muted-foreground">Create a one-time trigger that fires once then removes itself.</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">{`local id = tempTrigger("You wake up", 'send("look")', 60)`}</pre>
            </div>
            <div>
              <h4 className="font-semibold font-mono">tempAlias(pattern, script)</h4>
              <p className="text-sm text-muted-foreground">Create a temporary alias (lasts until killed or session ends).</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">{`local id = tempAlias("^test$", 'echo("Testing!")')`}</pre>
            </div>
            <div>
              <h4 className="font-semibold font-mono">tempTimer(seconds, script)</h4>
              <p className="text-sm text-muted-foreground">Create a one-shot timer that executes after delay.</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">{`tempTimer(5, 'send("look")')  -- Run after 5 seconds`}</pre>
            </div>
            <div>
              <h4 className="font-semibold font-mono">killTrigger(id), killAlias(id), killTimer(id)</h4>
              <p className="text-sm text-muted-foreground">Remove a temporary trigger, alias, or timer by ID.</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">killTimer(myTimerId)</pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Toggle Functions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold font-mono">enableTrigger(name), disableTrigger(name)</h4>
              <p className="text-sm text-muted-foreground">Enable or disable a trigger by pattern or ID.</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">disableTrigger("spam_trigger")</pre>
            </div>
            <div>
              <h4 className="font-semibold font-mono">enableAlias(name), disableAlias(name)</h4>
              <p className="text-sm text-muted-foreground">Enable or disable an alias by pattern or ID.</p>
            </div>
            <div>
              <h4 className="font-semibold font-mono">enableTimer(name), disableTimer(name)</h4>
              <p className="text-sm text-muted-foreground">Enable or disable a timer by ID.</p>
            </div>
            <div>
              <h4 className="font-semibold font-mono">enableClass(name), disableClass(name)</h4>
              <p className="text-sm text-muted-foreground">Enable or disable all items in a class.</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">enableClass("combat")  -- Enable all combat automation</pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Utility Functions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold font-mono">expandAlias(command)</h4>
              <p className="text-sm text-muted-foreground">Process a command through alias expansion.</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">local expanded = expandAlias("tt hello")</pre>
            </div>
            <div>
              <h4 className="font-semibold font-mono">fireTrigger(name, line)</h4>
              <p className="text-sm text-muted-foreground">Execute another trigger by pattern or ID. Useful for trigger chaining.</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">{`fireTrigger("process_combat")  -- Chain to another trigger
fireTrigger("room_parser", line)  -- Pass current line`}</pre>
            </div>
            <div>
              <h4 className="font-semibold font-mono">isPrompt()</h4>
              <p className="text-sm text-muted-foreground">Check if the current line matches the prompt pattern (configure in per-MUD settings).</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">{`if isPrompt() then
  -- End of command output
  processBuffer()
end`}</pre>
            </div>
            <div>
              <h4 className="font-semibold font-mono">wait(seconds, callback)</h4>
              <p className="text-sm text-muted-foreground">Execute code after a delay.</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">{`wait(2, function()
  send("look")
end)`}</pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications & Gauges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold font-mono">notify(message, type)</h4>
              <p className="text-sm text-muted-foreground">Show a popup notification. Type can be "info", "success", "warning", or "danger".</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">notify("Low health!", "danger")</pre>
            </div>
            <div>
              <h4 className="font-semibold font-mono">setGauge(name, current, max, color)</h4>
              <p className="text-sm text-muted-foreground">Create or update a visual meter. Color is optional (auto: green/yellow/red).</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">setGauge("health", 75, 100, "red")</pre>
            </div>
            <div>
              <h4 className="font-semibold font-mono">clearGauge(name)</h4>
              <p className="text-sm text-muted-foreground">Remove a gauge from the display.</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">clearGauge("health")</pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cooldowns & Spam Prevention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold font-mono">cooldown(name, seconds)</h4>
              <p className="text-sm text-muted-foreground">Returns true if enough time has passed since last use. Prevents spamming commands.</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">{`if cooldown("heal", 5) then
  send("cast heal")
else
  echo("Heal is on cooldown!")
end`}</pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Movement & Command Sequences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold font-mono">queue(cmd1, cmd2, ...)</h4>
              <p className="text-sm text-muted-foreground">Send multiple commands with automatic delays between them.</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">queue("kick", "punch", "uppercut")</pre>
            </div>
            <div>
              <h4 className="font-semibold font-mono">speedwalk(path)</h4>
              <p className="text-sm text-muted-foreground">Automatically walk a path. Use numbers for repeats: "3n" = 3 north, "2e" = 2 east.</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">speedwalk("3n 2e s")  -- North 3x, East 2x, South 1x</pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session Logging</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold font-mono">log(message)</h4>
              <p className="text-sm text-muted-foreground">Add an entry to your session journal with timestamp.</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">log("Killed the dragon!")</pre>
            </div>
            <div>
              <h4 className="font-semibold font-mono">showLog()</h4>
              <p className="text-sm text-muted-foreground">Display the session log in the terminal.</p>
            </div>
            <div>
              <h4 className="font-semibold font-mono">clearLog()</h4>
              <p className="text-sm text-muted-foreground">Clear the session log.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stopwatch & Timing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold font-mono">startStopwatch(name)</h4>
              <p className="text-sm text-muted-foreground">Start a named timer.</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">startStopwatch("boss_fight")</pre>
            </div>
            <div>
              <h4 className="font-semibold font-mono">getElapsed(name)</h4>
              <p className="text-sm text-muted-foreground">Get seconds elapsed since timer started.</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">echo("Fight took " .. getElapsed("boss_fight") .. " seconds")</pre>
            </div>
            <div>
              <h4 className="font-semibold font-mono">stopStopwatch(name)</h4>
              <p className="text-sm text-muted-foreground">Stop a timer and return elapsed time.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>String Helpers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground mb-2">
              These functions make it easier to work with text without needing regex knowledge.
            </p>
            <div>
              <h4 className="font-semibold font-mono">extractNumber(text)</h4>
              <p className="text-sm text-muted-foreground">Get the first number from text.</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">local hp = extractNumber("You have 50 health")</pre>
            </div>
            <div>
              <h4 className="font-semibold font-mono">extractNumbers(text)</h4>
              <p className="text-sm text-muted-foreground">Get all numbers from text as a table.</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">local nums = extractNumbers("HP: 50/100")</pre>
            </div>
            <div>
              <h4 className="font-semibold font-mono">contains(text, search)</h4>
              <p className="text-sm text-muted-foreground">Check if text contains a substring.</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">{`if contains(line, "dragon") then ... end`}</pre>
            </div>
            <div>
              <h4 className="font-semibold font-mono">startsWith(text, prefix), endsWith(text, suffix)</h4>
              <p className="text-sm text-muted-foreground">Check if text starts or ends with a string.</p>
            </div>
            <div>
              <h4 className="font-semibold font-mono">split(text, delimiter)</h4>
              <p className="text-sm text-muted-foreground">Split text into parts.</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">local words = split(line, " ")</pre>
            </div>
            <div>
              <h4 className="font-semibold font-mono">trim(text), lower(text), upper(text)</h4>
              <p className="text-sm text-muted-foreground">String manipulation utilities.</p>
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
                  <td className="py-2 pr-4 font-mono text-sm">matches[0]</td>
                  <td className="py-2">Full matched text</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-sm">matches[1], matches[2], ...</td>
                  <td className="py-2">Capture groups from regex</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-sm">captures.name</td>
                  <td className="py-2">Named capture groups (from patterns like <code className="bg-muted px-1 rounded">{`(?<name>\\w+)`}</code>)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-sm">line</td>
                  <td className="py-2">The full line that triggered</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-4">
              <h4 className="font-semibold">Named Capture Example:</h4>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto mt-2">
{`-- Trigger pattern: (?<enemy>\\w+) attacks you for (?<damage>\\d+)
echo("Attacked by: " .. captures.enemy)
echo("Damage: " .. captures.damage)`}
              </pre>
            </div>
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
