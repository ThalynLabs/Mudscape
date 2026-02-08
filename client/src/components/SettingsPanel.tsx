import { Profile, ProfileSettings } from "@shared/schema";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useUpdateProfile } from "@/hooks/use-profiles";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSpeech } from "@/hooks/use-speech";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SettingsPanelProps {
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsPanel({ profile, open, onOpenChange }: SettingsPanelProps) {
  const updateMutation = useUpdateProfile();
  const settings = profile.settings as ProfileSettings;
  const { voices } = useSpeech({ enabled: false });

  const updateSetting = (key: keyof ProfileSettings, value: any) => {
    updateMutation.mutate({
      id: profile.id,
      settings: { ...settings, [key]: value },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] border-l border-border bg-card flex flex-col" data-testid="settings-panel">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Terminal Settings</SheetTitle>
          <SheetDescription>
            Configure accessibility, appearance, and audio.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="py-6 space-y-8">
            <section className="space-y-4" aria-labelledby="settings-appearance">
              <h3 id="settings-appearance" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Appearance</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="font-scale">Font Scale</Label>
                  <span className="text-xs font-mono" aria-hidden="true">{settings.fontScale || 1}x</span>
                </div>
                <Slider
                  id="font-scale"
                  aria-label={`Font Scale, currently ${settings.fontScale || 1}x`}
                  min={0.8}
                  max={2.0}
                  step={0.1}
                  value={[settings.fontScale || 1]}
                  onValueChange={([val]) => updateSetting('fontScale', val)}
                  data-testid="slider-font-scale"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor="high-contrast">High Contrast Mode</Label>
                  <p className="text-xs text-muted-foreground" id="high-contrast-desc">Removes background colors for readability</p>
                </div>
                <Switch
                  id="high-contrast"
                  aria-describedby="high-contrast-desc"
                  checked={settings.highContrast ?? false}
                  onCheckedChange={(val) => updateSetting('highContrast', val)}
                  data-testid="switch-high-contrast"
                />
              </div>

            </section>

            <section className="space-y-4" aria-labelledby="settings-speech">
              <h3 id="settings-speech" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Speech & Text-to-Speech</h3>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor="speech-enabled">Text-to-Speech</Label>
                  <p className="text-xs text-muted-foreground" id="speech-enabled-desc">Read new lines aloud automatically</p>
                </div>
                <Switch
                  id="speech-enabled"
                  aria-describedby="speech-enabled-desc"
                  checked={settings.speechEnabled ?? false}
                  onCheckedChange={(val) => updateSetting('speechEnabled', val)}
                  data-testid="switch-speech-enabled"
                />
              </div>

              {settings.speechEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="speech-voice">Voice</Label>
                    <Select
                      value={settings.speechVoice ?? undefined}
                      onValueChange={(val) => updateSetting('speechVoice', val)}
                    >
                      <SelectTrigger id="speech-voice" data-testid="select-speech-voice">
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
                    <div className="flex items-center justify-between gap-4">
                      <Label htmlFor="speech-rate">Speech Rate</Label>
                      <span className="text-xs font-mono" aria-hidden="true">{settings.speechRate || 1}x</span>
                    </div>
                    <Slider
                      id="speech-rate"
                      aria-label={`Speech Rate, currently ${settings.speechRate || 1}x`}
                      min={0.5}
                      max={3.0}
                      step={0.1}
                      value={[settings.speechRate || 1]}
                      onValueChange={([val]) => updateSetting('speechRate', val)}
                      data-testid="slider-speech-rate"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <Label htmlFor="speech-volume">Speech Volume</Label>
                      <span className="text-xs font-mono" aria-hidden="true">{Math.round((settings.speechVolume || 1) * 100)}%</span>
                    </div>
                    <Slider
                      id="speech-volume"
                      aria-label={`Speech Volume, currently ${Math.round((settings.speechVolume || 1) * 100)} percent`}
                      min={0}
                      max={1}
                      step={0.05}
                      value={[settings.speechVolume || 1]}
                      onValueChange={([val]) => updateSetting('speechVolume', val)}
                      data-testid="slider-speech-volume"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <Label htmlFor="speech-pitch">Speech Pitch</Label>
                      <span className="text-xs font-mono" aria-hidden="true">{settings.speechPitch || 1}x</span>
                    </div>
                    <Slider
                      id="speech-pitch"
                      aria-label={`Speech Pitch, currently ${settings.speechPitch || 1}x`}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                      value={[settings.speechPitch || 1]}
                      onValueChange={([val]) => updateSetting('speechPitch', val)}
                      data-testid="slider-speech-pitch"
                    />
                  </div>

                  <div className="pt-4 border-t border-border space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Speech Interruption</h4>
                    
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="interrupt-keypress">Interrupt on keypress</Label>
                        <p className="text-xs text-muted-foreground" id="interrupt-keypress-desc">Stop speech when you type</p>
                      </div>
                      <Switch
                        id="interrupt-keypress"
                        aria-describedby="interrupt-keypress-desc"
                        checked={settings.interruptOnKeypress ?? false}
                        onCheckedChange={(val) => updateSetting('interruptOnKeypress', val)}
                        data-testid="switch-interrupt-keypress"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="interrupt-send">Interrupt on send</Label>
                        <p className="text-xs text-muted-foreground" id="interrupt-send-desc">Stop speech when you press Enter</p>
                      </div>
                      <Switch
                        id="interrupt-send"
                        aria-describedby="interrupt-send-desc"
                        checked={settings.interruptOnSend ?? true}
                        onCheckedChange={(val) => updateSetting('interruptOnSend', val)}
                        data-testid="switch-interrupt-send"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="interrupt-incoming">Interrupt on incoming</Label>
                        <p className="text-xs text-muted-foreground" id="interrupt-incoming-desc">Stop speech when new text arrives</p>
                      </div>
                      <Switch
                        id="interrupt-incoming"
                        aria-describedby="interrupt-incoming-desc"
                        checked={settings.interruptOnIncoming ?? false}
                        onCheckedChange={(val) => updateSetting('interruptOnIncoming', val)}
                        data-testid="switch-interrupt-incoming"
                      />
                    </div>
                  </div>
                </>
              )}
            </section>

            <section className="space-y-4" aria-labelledby="settings-screenreader">
              <h3 id="settings-screenreader" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Screen Reader</h3>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor="reader-mode">Reader Mode</Label>
                  <p className="text-xs text-muted-foreground" id="reader-mode-desc">Queue speech until you press Enter</p>
                </div>
                <Switch
                  id="reader-mode"
                  aria-describedby="reader-mode-desc"
                  checked={settings.readerMode ?? false}
                  onCheckedChange={(val) => updateSetting('readerMode', val)}
                  data-testid="switch-reader-mode"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor="screen-reader-announce">Screen Reader Announcements</Label>
                  <p className="text-xs text-muted-foreground" id="screen-reader-announce-desc">Use ARIA live regions for NVDA/JAWS auto-speaking</p>
                </div>
                <Switch
                  id="screen-reader-announce"
                  aria-describedby="screen-reader-announce-desc"
                  checked={settings.screenReaderAnnounce ?? false}
                  onCheckedChange={(val) => updateSetting('screenReaderAnnounce', val)}
                  data-testid="switch-screen-reader-announce"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor="strip-symbols">Strip Symbols</Label>
                  <p className="text-xs text-muted-foreground" id="strip-symbols-desc">Remove decorative characters for screen readers</p>
                </div>
                <Switch
                  id="strip-symbols"
                  aria-describedby="strip-symbols-desc"
                  checked={settings.stripSymbols ?? false}
                  onCheckedChange={(val) => updateSetting('stripSymbols', val)}
                  data-testid="switch-strip-symbols"
                />
              </div>
            </section>

            <section className="space-y-4" aria-labelledby="settings-protocol">
              <h3 id="settings-protocol" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Protocol</h3>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor="gmcp-enabled">Enable GMCP</Label>
                  <p className="text-xs text-muted-foreground" id="gmcp-enabled-desc">Receive structured data from MUD</p>
                </div>
                <Switch
                  id="gmcp-enabled"
                  aria-describedby="gmcp-enabled-desc"
                  checked={settings.gmcpEnabled ?? true}
                  onCheckedChange={(val) => updateSetting('gmcpEnabled', val)}
                  data-testid="switch-gmcp-enabled"
                />
              </div>
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
