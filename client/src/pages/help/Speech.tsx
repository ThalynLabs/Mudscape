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
      </div>
    </HelpLayout>
  );
}
