import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpLayout } from "@/components/HelpLayout";

export default function Sounds() {
  return (
    <HelpLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Sound System</h2>
          <p className="text-muted-foreground">
            Mudscape supports sounds via soundpacks, the MSP protocol, and Lua scripting.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Soundpacks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              Upload sound files and organize them into soundpacks. 
              Select an active soundpack for each profile.
            </p>
            <h4 className="font-semibold mt-4">Managing Soundpacks</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open the Soundpack Manager from the Play toolbar</li>
              <li>Create a new soundpack or select an existing one</li>
              <li>Upload sound files (.mp3, .wav, .ogg)</li>
              <li>Set the soundpack as active for your profile</li>
            </ol>
            <p className="text-sm text-muted-foreground mt-2">
              Sounds are preloaded when you switch soundpacks for faster playback.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>MSP Protocol</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              Mudscape automatically parses MSP (MUD Sound Protocol) triggers from MUD output:
            </p>
            <table className="w-full mt-2">
              <tbody className="divide-y">
                <tr>
                  <td className="py-2 pr-4 font-mono text-sm">!!SOUND(name)</td>
                  <td className="py-2">Play a sound</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-sm">!!SOUND(name vol=50)</td>
                  <td className="py-2">Play at 50% volume</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-sm">!!SOUND(name loop=-1)</td>
                  <td className="py-2">Loop indefinitely</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-sm">!!MUSIC(name)</td>
                  <td className="py-2">Play background music</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lua Sound API</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold font-mono">playSound(name, volume, loop)</h4>
              <p className="text-sm text-muted-foreground">Play a sound from the active soundpack.</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">
{`playSound("sword_hit", 0.8, false)  -- 80% volume, no loop
playSound("rain", 0.5, true)        -- 50% volume, loop`}
              </pre>
            </div>
            <div>
              <h4 className="font-semibold font-mono">stopSound(name)</h4>
              <p className="text-sm text-muted-foreground">Stop a playing/looping sound.</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">stopSound("rain")</pre>
            </div>
            <div>
              <h4 className="font-semibold font-mono">loopSound(name, volume)</h4>
              <p className="text-sm text-muted-foreground">Convenience function to start a looping sound.</p>
              <pre className="bg-muted p-2 rounded text-sm mt-1">loopSound("campfire", 0.6)</pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spatial Audio (3D Sound)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              Position sounds in 3D space using HRTF (Head-Related Transfer Function) 
              for realistic spatial audio. This is especially useful for accessibility, 
              helping you locate things by sound.
            </p>
            <div className="mt-4">
              <h4 className="font-semibold font-mono">setSoundPosition(name, x, y, z)</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Position a sound relative to the listener.
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                <li><strong>x</strong> - Left (-) / Right (+)</li>
                <li><strong>y</strong> - Down (-) / Up (+)</li>
                <li><strong>z</strong> - Front (-) / Back (+)</li>
              </ul>
              <pre className="bg-muted p-2 rounded text-sm mt-2">
{`-- Enemy approaching from the right
setSoundPosition("footsteps", 3, 0, -2)

-- Water flowing to your left
setSoundPosition("river", -5, 0, 0)`}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Master Volume</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              The sound system uses a master volume control via Web Audio API's GainNode.
              Individual sound volumes are relative to the master volume.
            </p>
          </CardContent>
        </Card>
      </div>
    </HelpLayout>
  );
}
