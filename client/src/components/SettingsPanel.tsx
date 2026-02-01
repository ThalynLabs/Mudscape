import { Profile, ProfileSettings } from "@shared/schema";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useUpdateProfile } from "@/hooks/use-profiles";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSpeech } from "@/hooks/use-speech";

interface SettingsPanelProps {
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsPanel({ profile, open, onOpenChange }: SettingsPanelProps) {
  const updateMutation = useUpdateProfile();
  const settings = profile.settings as ProfileSettings;
  const { voices } = useSpeech({ enabled: false }); // Just to get voice list

  const updateSetting = (key: keyof ProfileSettings, value: any) => {
    updateMutation.mutate({
      id: profile.id,
      settings: { ...settings, [key]: value },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] border-l border-border bg-card">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Terminal Settings</SheetTitle>
          <SheetDescription>
            Configure accessibility, appearance, and audio.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-8">
          {/* Appearance Section */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Appearance</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="font-scale">Font Scale</Label>
                <span className="text-xs font-mono">{settings.fontScale || 1}x</span>
              </div>
              <Slider
                id="font-scale"
                min={0.8}
                max={2.0}
                step={0.1}
                value={[settings.fontScale || 1]}
                onValueChange={([val]) => updateSetting('fontScale', val)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="high-contrast">High Contrast Mode</Label>
                <p className="text-xs text-muted-foreground">Removes background colors for readability</p>
              </div>
              <Switch
                id="high-contrast"
                checked={settings.highContrast ?? false}
                onCheckedChange={(val) => updateSetting('highContrast', val)}
              />
            </div>
          </section>

          {/* Accessibility / Audio Section */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Accessibility & Audio</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="speech-enabled">Text-to-Speech</Label>
                <p className="text-xs text-muted-foreground">Read new lines aloud automatically</p>
              </div>
              <Switch
                id="speech-enabled"
                checked={settings.speechEnabled ?? false}
                onCheckedChange={(val) => updateSetting('speechEnabled', val)}
              />
            </div>

            {settings.speechEnabled && (
              <>
                <div className="space-y-2">
                  <Label>Voice</Label>
                  <Select
                    value={settings.speechVoice ?? undefined}
                    onValueChange={(val) => updateSetting('speechVoice', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {voices.map((voice) => (
                        <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                          {voice.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Speech Rate</Label>
                    <span className="text-xs font-mono">{settings.speechRate || 1}x</span>
                  </div>
                  <Slider
                    min={0.5}
                    max={3.0}
                    step={0.1}
                    value={[settings.speechRate || 1]}
                    onValueChange={([val]) => updateSetting('speechRate', val)}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Speech Volume</Label>
                    <span className="text-xs font-mono">{Math.round((settings.speechVolume || 1) * 100)}%</span>
                  </div>
                  <Slider
                    min={0}
                    max={1}
                    step={0.05}
                    value={[settings.speechVolume || 1]}
                    onValueChange={([val]) => updateSetting('speechVolume', val)}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Speech Pitch</Label>
                    <span className="text-xs font-mono">{settings.speechPitch || 1}x</span>
                  </div>
                  <Slider
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    value={[settings.speechPitch || 1]}
                    onValueChange={([val]) => updateSetting('speechPitch', val)}
                  />
                </div>

                <div className="pt-4 border-t border-border space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Speech Interruption</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="interrupt-keypress">Interrupt on keypress</Label>
                      <p className="text-xs text-muted-foreground">Stop speech when you type</p>
                    </div>
                    <Switch
                      id="interrupt-keypress"
                      checked={settings.interruptOnKeypress ?? false}
                      onCheckedChange={(val) => updateSetting('interruptOnKeypress', val)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="interrupt-send">Interrupt on send</Label>
                      <p className="text-xs text-muted-foreground">Stop speech when you press Enter</p>
                    </div>
                    <Switch
                      id="interrupt-send"
                      checked={settings.interruptOnSend ?? true}
                      onCheckedChange={(val) => updateSetting('interruptOnSend', val)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="interrupt-incoming">Interrupt on incoming</Label>
                      <p className="text-xs text-muted-foreground">Stop speech when new text arrives</p>
                    </div>
                    <Switch
                      id="interrupt-incoming"
                      checked={settings.interruptOnIncoming ?? false}
                      onCheckedChange={(val) => updateSetting('interruptOnIncoming', val)}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="space-y-0.5">
                <Label htmlFor="reader-mode">Screen Reader Mode</Label>
                <p className="text-xs text-muted-foreground">Optimizes aria-live regions for NVDA/JAWS</p>
              </div>
              <Switch
                id="reader-mode"
                checked={settings.readerMode ?? false}
                onCheckedChange={(val) => updateSetting('readerMode', val)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="strip-symbols">Strip Symbols</Label>
                <p className="text-xs text-muted-foreground">Remove decorative characters for screen readers</p>
              </div>
              <Switch
                id="strip-symbols"
                checked={settings.stripSymbols ?? false}
                onCheckedChange={(val) => updateSetting('stripSymbols', val)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="gmcp-enabled">Enable GMCP</Label>
                <p className="text-xs text-muted-foreground">Receive structured data from MUD</p>
              </div>
              <Switch
                id="gmcp-enabled"
                checked={settings.gmcpEnabled ?? true}
                onCheckedChange={(val) => updateSetting('gmcpEnabled', val)}
              />
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
