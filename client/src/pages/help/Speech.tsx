import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpLayout } from "@/components/HelpLayout";

export default function Speech() {
  return (
    <HelpLayout>
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
              <li>Type <code className="bg-muted px-1 rounded">/config speech on</code> or <code className="bg-muted px-1 rounded">/config speech off</code></li>
              <li>Go to Settings and toggle "Enable Speech"</li>
              <li>Configure per-profile in Per-MUD Settings</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              The command prefix (default <code className="bg-muted px-1 rounded">/</code>) can be customized in Settings.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Adjusting Voice Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>Fine-tune speech while playing:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><code className="bg-muted px-1 rounded">/config rate 1.5</code> - Speed (0.5 to 2.0)</li>
              <li><code className="bg-muted px-1 rounded">/config volume 80</code> - Volume (0 to 100)</li>
              <li><code className="bg-muted px-1 rounded">/config pitch 1.0</code> - Pitch (0.5 to 2.0)</li>
              <li><code className="bg-muted px-1 rounded">/config voice</code> - List available voices</li>
              <li><code className="bg-muted px-1 rounded">/config voice 3</code> - Select voice #3</li>
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
              Enable with <code className="bg-muted px-1 rounded">/config reader on</code> or in Settings.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Strip Symbols</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              Enable "Strip Symbols" in Display settings to remove decorative characters 
              like box drawing, ASCII art, and special symbols from speech output.
            </p>
            <p className="text-sm text-muted-foreground">
              This makes screen reader output cleaner and easier to understand.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>NVDA/JAWS Screen Reader Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              If you use NVDA or JAWS, Mudscape can announce new lines through your 
              screen reader instead of (or in addition to) browser speech.
            </p>
            <h4 className="font-semibold mt-2">Enabling Screen Reader Announcements</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Type <code className="bg-muted px-1 rounded">/config screenreader on</code></li>
              <li>Or go to Settings and enable "Screen Reader Announcements"</li>
              <li>Aliases: <code className="bg-muted px-1 rounded">/config sr on</code>, <code className="bg-muted px-1 rounded">/config nvda on</code>, <code className="bg-muted px-1 rounded">/config jaws on</code></li>
            </ul>
            <h4 className="font-semibold mt-3">How It Works</h4>
            <p>
              This uses ARIA live regions to send new MUD lines to your screen reader. 
              NVDA and JAWS will automatically speak new content as it arrives.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              You can use this alongside browser speech, or disable browser speech 
              (<code className="bg-muted px-1 rounded">/config speech off</code>) to only hear your screen reader.
            </p>
          </CardContent>
        </Card>
      </div>
    </HelpLayout>
  );
}
