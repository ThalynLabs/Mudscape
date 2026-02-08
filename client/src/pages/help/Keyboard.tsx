import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpLayout } from "@/components/HelpLayout";

export default function Keyboard() {
  return (
    <HelpLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Keyboard Shortcuts</h2>
          <p className="text-muted-foreground">
            Quick keyboard access to common features while playing.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Speech Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <tbody className="divide-y">
                <tr>
                  <td className="py-2 pr-4"><kbd className="bg-muted px-2 py-0.5 rounded text-sm">Ctrl+1</kbd> through <kbd className="bg-muted px-2 py-0.5 rounded text-sm">Ctrl+9</kbd></td>
                  <td className="py-2">Read the 1st through 9th most recent line</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4"><kbd className="bg-muted px-2 py-0.5 rounded text-sm">Ctrl+1</kbd> twice quickly</td>
                  <td className="py-2">Copy that line to clipboard (double-tap within 400ms)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4"><kbd className="bg-muted px-2 py-0.5 rounded text-sm">Ctrl</kbd> <kbd className="bg-muted px-2 py-0.5 rounded text-sm">Ctrl</kbd> (double-tap)</td>
                  <td className="py-2">Pause/resume speech</td>
                </tr>
              </tbody>
            </table>
            <p className="text-sm text-muted-foreground mt-3">
              Double-tap Ctrl is used instead of single press to avoid conflicts with screen reader 
              modifier keys (VoiceOver uses Ctrl+Option).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <tbody className="divide-y">
                <tr>
                  <td className="py-2 pr-4"><kbd className="bg-muted px-2 py-0.5 rounded text-sm">F1</kbd></td>
                  <td className="py-2">Open this help wiki</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4"><kbd className="bg-muted px-2 py-0.5 rounded text-sm">Up Arrow</kbd></td>
                  <td className="py-2">Previous command in history</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4"><kbd className="bg-muted px-2 py-0.5 rounded text-sm">Down Arrow</kbd></td>
                  <td className="py-2">Next command in history</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4"><kbd className="bg-muted px-2 py-0.5 rounded text-sm">Escape</kbd></td>
                  <td className="py-2">Clear input line / Close dialogs</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4"><kbd className="bg-muted px-2 py-0.5 rounded text-sm">Enter</kbd></td>
                  <td className="py-2">Send command (clears input unless "Keep Input" is enabled)</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Multi-MUD Tab Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              When you have multiple MUD connections open, use these keys while focused on the tab bar:
            </p>
            <table className="w-full">
              <tbody className="divide-y">
                <tr>
                  <td className="py-2 pr-4"><kbd className="bg-muted px-2 py-0.5 rounded text-sm">Left Arrow</kbd></td>
                  <td className="py-2">Switch to previous connection tab</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4"><kbd className="bg-muted px-2 py-0.5 rounded text-sm">Right Arrow</kbd></td>
                  <td className="py-2">Switch to next connection tab</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4"><kbd className="bg-muted px-2 py-0.5 rounded text-sm">Home</kbd></td>
                  <td className="py-2">Switch to first connection tab</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4"><kbd className="bg-muted px-2 py-0.5 rounded text-sm">End</kbd></td>
                  <td className="py-2">Switch to last connection tab</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4"><kbd className="bg-muted px-2 py-0.5 rounded text-sm">Delete</kbd></td>
                  <td className="py-2">Close the focused connection tab</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custom Keybindings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              Create your own keyboard shortcuts in the Keybindings panel (accessible from the Play screen toolbar).
            </p>
            <p>
              Keybindings can send commands or execute Lua scripts.
            </p>
            <h4 className="font-semibold mt-4">Creating a Keybinding</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open the Keybindings panel from the toolbar</li>
              <li>Click "Add Keybinding"</li>
              <li>Press the key combination you want to use</li>
              <li>Enter the command or Lua script to execute</li>
              <li>Save the keybinding</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modifier Keys</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>Keybindings can use modifier key combinations:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Ctrl</strong> - Control key</li>
              <li><strong>Alt</strong> - Alt/Option key</li>
              <li><strong>Shift</strong> - Shift key</li>
              <li><strong>Meta</strong> - Windows/Command key</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              Combine modifiers for unique shortcuts, e.g., Ctrl+Shift+H
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reserved Shortcuts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>Some keyboard shortcuts are reserved by Mudscape and cannot be overridden:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><kbd className="bg-muted px-2 py-0.5 rounded text-sm">Ctrl+1-9</kbd> - Read recent lines</li>
              <li><kbd className="bg-muted px-2 py-0.5 rounded text-sm">F1</kbd> - Open help wiki</li>
              <li><kbd className="bg-muted px-2 py-0.5 rounded text-sm">Escape</kbd> - Clear input / close dialogs</li>
              <li><kbd className="bg-muted px-2 py-0.5 rounded text-sm">Enter</kbd> - Send command</li>
              <li><kbd className="bg-muted px-2 py-0.5 rounded text-sm">Up/Down Arrow</kbd> - Command history</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              Browser shortcuts like Ctrl+C, Ctrl+V, and Ctrl+A also remain functional.
            </p>
          </CardContent>
        </Card>
      </div>
    </HelpLayout>
  );
}
