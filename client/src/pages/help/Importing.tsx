import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpLayout } from "@/components/HelpLayout";

export default function Importing() {
  return (
    <HelpLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Importing from Other Clients</h2>
          <p className="text-muted-foreground">
            Bring your scripts, triggers, aliases, sounds, and more from other MUD clients into Mudscape.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Supported Clients</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              Mudscape can import automation from these MUD clients:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Mudlet</strong> &mdash; .mpackage, .zip, and .xml files (triggers, aliases, timers, keybindings, buttons, scripts, sounds)</li>
              <li><strong>TinTin++</strong> &mdash; .tt, .tin, .txt, and .cfg config files plus sound files (triggers, aliases, timers, sounds)</li>
              <li><strong>VIPMud</strong> &mdash; .set and .cfg files (triggers, aliases, keybindings)</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              All imports are accessed from the Package Manager, which you open from the toolbar while connected to a MUD.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How to Open the Package Manager</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="list-decimal list-inside space-y-2">
              <li>Go to the home screen and connect to (or create) a MUD profile</li>
              <li>Once on the Play screen, look for the toolbar at the top</li>
              <li>Click the <strong>Library</strong> button in the top-left area of the toolbar</li>
              <li>The Package Manager panel slides open from the side</li>
              <li>Make sure you are on the <strong>Library</strong> tab (it is selected by default)</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Importing from Mudlet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              If you have existing Mudlet packages, you can bring them straight into Mudscape.
              Lua scripts work in both clients, so your automation logic transfers directly.
            </p>
            <h4 className="font-semibold mt-4">Exporting from Mudlet</h4>
            <ol className="list-decimal list-inside space-y-2">
              <li>In Mudlet, open the <strong>Package Manager</strong> (toolbox icon or Ctrl+I)</li>
              <li>Click <strong>Export</strong> next to the package you want</li>
              <li>Save the <code className="bg-muted px-1 rounded">.mpackage</code> file somewhere you can find it</li>
            </ol>
            <p className="text-sm text-muted-foreground mt-2">
              Alternatively, you can export individual items from the Script Editor. 
              Right-click a folder and choose "Export Package" to save it as an .xml file.
            </p>

            <h4 className="font-semibold mt-4">Importing into Mudscape</h4>
            <ol className="list-decimal list-inside space-y-2">
              <li>Open the Package Manager in Mudscape</li>
              <li>Click <strong>Import Mudlet Package</strong></li>
              <li>Select your <code className="bg-muted px-1 rounded">.mpackage</code>, <code className="bg-muted px-1 rounded">.zip</code>, or <code className="bg-muted px-1 rounded">.xml</code> file</li>
              <li>A preview shows what was found (triggers, aliases, timers, sounds, etc.)</li>
              <li>Click <strong>Install to [Profile]</strong> to add everything to your current profile, or <strong>Save to Library</strong> to store it for later</li>
            </ol>

            <h4 className="font-semibold mt-4">What gets imported</h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Triggers</strong> &mdash; Pattern matching (regex and substring)</li>
              <li><strong>Aliases</strong> &mdash; Command shortcuts and macros</li>
              <li><strong>Timers</strong> &mdash; Scheduled execution (one-shot or repeating)</li>
              <li><strong>Keybindings</strong> &mdash; Keyboard shortcuts</li>
              <li><strong>Buttons</strong> &mdash; Clickable action buttons</li>
              <li><strong>Scripts</strong> &mdash; Lua code (preserved as-is)</li>
              <li><strong>Sounds</strong> &mdash; Sound files from the package are uploaded as a soundpack</li>
              <li><strong>Classes/Folders</strong> &mdash; Organizational groups are preserved</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Importing from TinTin++</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              TinTin++ users can import their config files and sound files together.
              Mudscape converts TinTin++ commands into its own trigger, alias, and timer system,
              and sound-playing commands are automatically converted to work with Mudscape's sound engine.
            </p>

            <h4 className="font-semibold mt-4">Preparing your files</h4>
            <p>
              Gather all the files you want to import. You can select multiple files at once:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Config files</strong> &mdash; Your <code className="bg-muted px-1 rounded">.tt</code>, <code className="bg-muted px-1 rounded">.tin</code>, <code className="bg-muted px-1 rounded">.txt</code>, or <code className="bg-muted px-1 rounded">.cfg</code> files containing #action, #alias, #ticker commands</li>
              <li><strong>Sound files</strong> &mdash; Any <code className="bg-muted px-1 rounded">.wav</code>, <code className="bg-muted px-1 rounded">.mp3</code>, <code className="bg-muted px-1 rounded">.ogg</code>, or other audio files that your scripts reference</li>
            </ul>

            <h4 className="font-semibold mt-4">Importing into Mudscape</h4>
            <ol className="list-decimal list-inside space-y-2">
              <li>Open the Package Manager in Mudscape</li>
              <li>Click <strong>Import TinTin++ (Scripts + Sounds)</strong></li>
              <li>Select all your files at once &mdash; config files and sound files together (hold Ctrl or Shift to select multiple)</li>
              <li>A preview shows what was found: triggers, aliases, timers, sound files, and which sounds are referenced by your scripts</li>
              <li>Click <strong>Install to [Profile]</strong> to add everything to your current profile</li>
              <li>Sound files are automatically uploaded as a soundpack and activated on your profile</li>
            </ol>

            <h4 className="font-semibold mt-4">What gets converted</h4>
            <ul className="list-disc list-inside space-y-1">
              <li><code className="bg-muted px-1 rounded">#action</code> &mdash; Becomes a trigger (wildcards %0-%9 are fully supported)</li>
              <li><code className="bg-muted px-1 rounded">#alias</code> &mdash; Becomes an alias (%0 captures all arguments)</li>
              <li><code className="bg-muted px-1 rounded">#ticker</code> &mdash; Becomes a repeating timer</li>
              <li><code className="bg-muted px-1 rounded">#system</code> sound commands &mdash; Commands like <code className="bg-muted px-1 rounded">aplay</code>, <code className="bg-muted px-1 rounded">play</code>, <code className="bg-muted px-1 rounded">mpv</code>, etc. are converted to <code className="bg-muted px-1 rounded">playSound()</code> calls</li>
            </ul>

            <h4 className="font-semibold mt-4">Sound command detection</h4>
            <p className="text-sm text-muted-foreground">
              If your TinTin++ scripts use <code className="bg-muted px-1 rounded">#system</code> commands to play sounds 
              (e.g., <code className="bg-muted px-1 rounded">#system aplay sounds/combat.wav</code>), Mudscape automatically 
              detects these and converts them to <code className="bg-muted px-1 rounded">playSound("combat")</code> calls. 
              Just make sure to include the matching sound files when you import.
            </p>

            <h4 className="font-semibold mt-4">Save to library only</h4>
            <p className="text-sm text-muted-foreground">
              If you prefer, you can click <strong>Save Scripts to Library</strong> instead to save only the scripts 
              (without sounds) for installation later.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Importing from VIPMud</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              VIPMud users can import their .SET configuration files.
            </p>

            <h4 className="font-semibold mt-4">Exporting from VIPMud</h4>
            <p>
              VIPMud stores its settings in <code className="bg-muted px-1 rounded">.set</code> or 
              <code className="bg-muted px-1 rounded">.cfg</code> files, typically in the VIPMud installation 
              folder. Locate the file for the MUD world you want to import.
            </p>

            <h4 className="font-semibold mt-4">Importing into Mudscape</h4>
            <ol className="list-decimal list-inside space-y-2">
              <li>Open the Package Manager in Mudscape</li>
              <li>Click <strong>Import VIPMud</strong></li>
              <li>Select your <code className="bg-muted px-1 rounded">.set</code> or <code className="bg-muted px-1 rounded">.cfg</code> file</li>
              <li>Preview the imported contents</li>
              <li>Click <strong>Install to [Profile]</strong> or <strong>Save to Library</strong></li>
            </ol>

            <h4 className="font-semibold mt-4">What gets converted</h4>
            <ul className="list-disc list-inside space-y-1">
              <li><code className="bg-muted px-1 rounded">#TRIGGER</code> &mdash; Becomes a trigger (the * wildcard is converted to regex)</li>
              <li><code className="bg-muted px-1 rounded">#ALIAS</code> &mdash; Becomes an alias</li>
              <li><code className="bg-muted px-1 rounded">#KEY</code> &mdash; Becomes a keybinding</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              VIPMud @variable references are automatically converted to 
              <code className="bg-muted px-1 rounded">getVariable()</code> calls in Mudscape.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tips for a Smooth Import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Preview first</strong> &mdash; Always check the preview to make sure everything looks right before installing</li>
              <li><strong>One profile at a time</strong> &mdash; Import to the profile for the specific MUD the scripts were written for</li>
              <li><strong>Include sounds</strong> &mdash; For TinTin++ and Mudlet, select your sound files alongside your config files so everything works together</li>
              <li><strong>Test after importing</strong> &mdash; Connect to your MUD and verify that triggers, aliases, and sounds work as expected</li>
              <li><strong>Edit if needed</strong> &mdash; After importing, you can fine-tune any trigger, alias, or timer from the Play toolbar (click Triggers, Aliases, etc.)</li>
              <li><strong>Lua scripting</strong> &mdash; If your scripts use client-specific functions, you may need to update them to use Mudscape's Lua API. Check the Lua Scripting help page for available functions.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>After Importing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              Once your scripts are installed on a profile, they work immediately:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Triggers</strong> activate automatically when matching text appears from the MUD</li>
              <li><strong>Aliases</strong> expand when you type the matching command</li>
              <li><strong>Timers</strong> start running on their schedule</li>
              <li><strong>Sounds</strong> play when triggered by your scripts or the MUD's sound protocol</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              You can enable, disable, or edit any imported item from the toolbar buttons 
              (Triggers, Aliases, etc.) while connected to your MUD.
            </p>
          </CardContent>
        </Card>
      </div>
    </HelpLayout>
  );
}
