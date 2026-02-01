import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpLayout } from "@/components/HelpLayout";

export default function Packages() {
  return (
    <HelpLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Package Manager</h2>
          <p className="text-muted-foreground">
            Share and reuse automation bundles across profiles.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>What is a Package?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              A package is a bundle of automation items that can be shared and reused:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Triggers</li>
              <li>Aliases</li>
              <li>Timers</li>
              <li>Keybindings</li>
              <li>Buttons</li>
              <li>Classes</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              Packages are saved as <code className="bg-muted px-1 rounded">.mudpack.json</code> files.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Creating a Package</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="list-decimal list-inside space-y-2">
              <li>Open the Package Manager from the Play toolbar</li>
              <li>Click "Create Package"</li>
              <li>Enter a name and description for your package</li>
              <li>Select which items to include (triggers, aliases, etc.)</li>
              <li>Click "Export" to download the package file</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Importing a Mudscape Package</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="list-decimal list-inside space-y-2">
              <li>Open the Package Manager</li>
              <li>Click "Import Mudscape"</li>
              <li>Select a <code className="bg-muted px-1 rounded">.mudpack.json</code> file</li>
              <li>The package appears in your library</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Importing Mudlet Packages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              Mudscape can import packages created with Mudlet, making it easy to migrate 
              your existing automation:
            </p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Open the Package Manager</li>
              <li>Click "Import Mudlet Package"</li>
              <li>Select a <code className="bg-muted px-1 rounded">.mpackage</code>, 
                  <code className="bg-muted px-1 rounded">.zip</code>, or 
                  <code className="bg-muted px-1 rounded">.xml</code> file</li>
              <li>Preview the imported contents</li>
              <li>Choose to save to library or install directly</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mudlet Compatibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              Mudscape converts the following Mudlet automation items:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Triggers</strong> - Pattern matching with regex or substring</li>
              <li><strong>Aliases</strong> - Command shortcuts and macros</li>
              <li><strong>Timers</strong> - Scheduled execution (one-shot or repeating)</li>
              <li><strong>Keybindings</strong> - Keyboard shortcuts</li>
              <li><strong>Buttons</strong> - Clickable action buttons</li>
              <li><strong>Scripts</strong> - Lua code (preserved as-is)</li>
              <li><strong>Classes/Folders</strong> - Organizational groups</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              Lua scripts work in both clients, so your automation logic transfers directly.
              Folder hierarchy is preserved - items stay grouped as they were in Mudlet.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Installing a Package</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              Once a package is in your library, you can install it to any profile:
            </p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Connect to the MUD profile you want to add the package to</li>
              <li>Open the Package Manager</li>
              <li>Find the package in your library</li>
              <li>Click "Install" to add its contents to the current profile</li>
            </ol>
            <p className="text-sm text-muted-foreground mt-2">
              Installing a package copies the items to your profile. 
              Changes to the package won't affect already-installed items.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Package Library</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              Your imported packages are stored in a library in the database, 
              making them available for installation across all your profiles.
            </p>
            <p className="text-sm text-muted-foreground">
              You can delete packages from the library when you no longer need them.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sharing Packages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              Share your automation with others by sending them your 
              <code className="bg-muted px-1 rounded">.mudpack.json</code> file.
            </p>
            <p className="text-sm text-muted-foreground">
              This is a great way to help new players or share strategies 
              with your MUD community.
            </p>
          </CardContent>
        </Card>
      </div>
    </HelpLayout>
  );
}
