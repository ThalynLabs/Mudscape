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
                  <Label id="label-font-scale">Font Scale</Label>
                  <span className="text-xs font-mono" aria-hidden="true">{settings.fontScale || 1}x</span>
                </div>
                <Slider
                  aria-label={`Font Scale, ${settings.fontScale || 1}x`}
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
                  <Label id="label-high-contrast">High Contrast Mode</Label>
                  <p className="text-xs text-muted-foreground" id="desc-high-contrast">Removes background colors for readability</p>
                </div>
                <Switch
                  aria-label="High Contrast Mode"
                  aria-describedby="desc-high-contrast"
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
                  <Label id="label-speech-enabled">Text-to-Speech</Label>
                  <p className="text-xs text-muted-foreground" id="desc-speech-enabled">Read new lines aloud automatically</p>
                </div>
                <Switch
                  aria-label="Text-to-Speech"
                  aria-describedby="desc-speech-enabled"
                  checked={settings.speechEnabled ?? false}
                  onCheckedChange={(val) => updateSetting('speechEnabled', val)}
                  data-testid="switch-speech-enabled"
                />
              </div>

              {settings.speechEnabled && (
                <>
                  <div className="space-y-2">
                    <Label id="label-speech-voice">Voice</Label>
                    <Select
                      value={settings.speechVoice ?? undefined}
                      onValueChange={(val) => updateSetting('speechVoice', val)}
                    >
                      <SelectTrigger aria-label="Voice" aria-labelledby="label-speech-voice" data-testid="select-speech-voice">
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
                      <Label id="label-speech-rate">Speech Rate</Label>
                      <span className="text-xs font-mono" aria-hidden="true">{settings.speechRate || 1}x</span>
                    </div>
                    <Slider
                      aria-label={`Speech Rate, ${settings.speechRate || 1}x`}
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
                      <Label id="label-speech-volume">Speech Volume</Label>
                      <span className="text-xs font-mono" aria-hidden="true">{Math.round((settings.speechVolume || 1) * 100)}%</span>
                    </div>
                    <Slider
                      aria-label={`Speech Volume, ${Math.round((settings.speechVolume || 1) * 100)} percent`}
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
                      <Label id="label-speech-pitch">Speech Pitch</Label>
                      <span className="text-xs font-mono" aria-hidden="true">{settings.speechPitch || 1}x</span>
                    </div>
                    <Slider
                      aria-label={`Speech Pitch, ${settings.speechPitch || 1}x`}
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
                        <Label id="label-interrupt-keypress">Interrupt on keypress</Label>
                        <p className="text-xs text-muted-foreground" id="desc-interrupt-keypress">Stop speech when you type</p>
                      </div>
                      <Switch
                        aria-label="Interrupt on keypress"
                        aria-describedby="desc-interrupt-keypress"
                        checked={settings.interruptOnKeypress ?? false}
                        onCheckedChange={(val) => updateSetting('interruptOnKeypress', val)}
                        data-testid="switch-interrupt-keypress"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <Label id="label-interrupt-send">Interrupt on send</Label>
                        <p className="text-xs text-muted-foreground" id="desc-interrupt-send">Stop speech when you press Enter</p>
                      </div>
                      <Switch
                        aria-label="Interrupt on send"
                        aria-describedby="desc-interrupt-send"
                        checked={settings.interruptOnSend ?? true}
                        onCheckedChange={(val) => updateSetting('interruptOnSend', val)}
                        data-testid="switch-interrupt-send"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <Label id="label-interrupt-incoming">Interrupt on incoming</Label>
                        <p className="text-xs text-muted-foreground" id="desc-interrupt-incoming">Stop speech when new text arrives</p>
                      </div>
                      <Switch
                        aria-label="Interrupt on incoming"
                        aria-describedby="desc-interrupt-incoming"
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
                  <Label id="label-reader-mode">Reader Mode</Label>
                  <p className="text-xs text-muted-foreground" id="desc-reader-mode">Queue speech until you press Enter</p>
                </div>
                <Switch
                  aria-label="Reader Mode"
                  aria-describedby="desc-reader-mode"
                  checked={settings.readerMode ?? false}
                  onCheckedChange={(val) => updateSetting('readerMode', val)}
                  data-testid="switch-reader-mode"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label id="label-screen-reader-announce">Screen Reader Announcements</Label>
                  <p className="text-xs text-muted-foreground" id="desc-screen-reader-announce">Use ARIA live regions for NVDA/JAWS auto-speaking</p>
                </div>
                <Switch
                  aria-label="Screen Reader Announcements"
                  aria-describedby="desc-screen-reader-announce"
                  checked={settings.screenReaderAnnounce ?? false}
                  onCheckedChange={(val) => updateSetting('screenReaderAnnounce', val)}
                  data-testid="switch-screen-reader-announce"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label id="label-strip-symbols">Strip Symbols</Label>
                  <p className="text-xs text-muted-foreground" id="desc-strip-symbols">Remove decorative characters for screen readers</p>
                </div>
                <Switch
                  aria-label="Strip Symbols"
                  aria-describedby="desc-strip-symbols"
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
                  <Label id="label-gmcp-enabled">Enable GMCP</Label>
                  <p className="text-xs text-muted-foreground" id="desc-gmcp-enabled">Receive structured data from MUD</p>
                </div>
                <Switch
                  aria-label="Enable GMCP"
                  aria-describedby="desc-gmcp-enabled"
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
