import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { GlobalSettings, Profile, DEFAULT_GLOBAL_SETTINGS } from "@shared/schema";
import { ArrowLeft, Settings as SettingsIcon, Volume2, Eye, Zap, Wifi, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";

function useGlobalSettings() {
  return useQuery<GlobalSettings>({
    queryKey: ['/api/settings'],
  });
}

function useUpdateGlobalSettings() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (updates: Partial<GlobalSettings>) => {
      const res = await apiRequest('PUT', '/api/settings', updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({ title: "Settings saved", description: "Your global settings have been updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

function useProfiles() {
  return useQuery<Profile[]>({
    queryKey: ['/api/profiles'],
  });
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
      <div className="space-y-1">
        <Label className="text-sm font-medium">{label}</Label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function GlobalSettingsTab() {
  const { data: settings, isLoading } = useGlobalSettings();
  const updateMutation = useUpdateGlobalSettings();
  const [localSettings, setLocalSettings] = useState<GlobalSettings>(DEFAULT_GLOBAL_SETTINGS);

  useEffect(() => {
    if (settings) {
      setLocalSettings({ ...DEFAULT_GLOBAL_SETTINGS, ...settings });
    }
  }, [settings]);

  const updateSetting = <K extends keyof GlobalSettings>(key: K, value: GlobalSettings[K]) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    updateMutation.mutate({ [key]: value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Speech
          </CardTitle>
          <CardDescription>Text-to-speech accessibility settings</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingRow label="Enable Speech" description="Read incoming MUD text aloud">
            <Switch
              data-testid="switch-speech-enabled"
              checked={localSettings.speechEnabled ?? true}
              onCheckedChange={(checked) => updateSetting('speechEnabled', checked)}
            />
          </SettingRow>
          <SettingRow label="Speech Rate" description="How fast text is read (0.5x to 2x)">
            <span className="text-sm w-12 text-right">{(localSettings.speechRate ?? 1).toFixed(1)}x</span>
            <Slider
              data-testid="slider-speech-rate"
              className="w-32"
              min={0.5}
              max={2}
              step={0.1}
              value={[localSettings.speechRate ?? 1]}
              onValueChange={([value]) => updateSetting('speechRate', value)}
            />
          </SettingRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Display
          </CardTitle>
          <CardDescription>Visual and terminal settings</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingRow label="Reader Mode" description="Pause speech until you press Enter">
            <Switch
              data-testid="switch-reader-mode"
              checked={localSettings.readerMode ?? false}
              onCheckedChange={(checked) => updateSetting('readerMode', checked)}
            />
          </SettingRow>
          <SettingRow label="Show Input Echo" description="Display your typed commands in the terminal">
            <Switch
              data-testid="switch-input-echo"
              checked={localSettings.showInputEcho ?? true}
              onCheckedChange={(checked) => updateSetting('showInputEcho', checked)}
            />
          </SettingRow>
          <SettingRow label="High Contrast" description="Increase contrast for better readability">
            <Switch
              data-testid="switch-high-contrast"
              checked={localSettings.highContrast ?? false}
              onCheckedChange={(checked) => updateSetting('highContrast', checked)}
            />
          </SettingRow>
          <SettingRow label="Font Scale" description="Adjust terminal text size">
            <span className="text-sm w-12 text-right">{((localSettings.fontScale ?? 1) * 100).toFixed(0)}%</span>
            <Slider
              data-testid="slider-font-scale"
              className="w-32"
              min={0.75}
              max={1.5}
              step={0.05}
              value={[localSettings.fontScale ?? 1]}
              onValueChange={([value]) => updateSetting('fontScale', value)}
            />
          </SettingRow>
          <SettingRow label="Line Height" description="Adjust spacing between lines">
            <span className="text-sm w-12 text-right">{(localSettings.lineHeight ?? 1.4).toFixed(1)}</span>
            <Slider
              data-testid="slider-line-height"
              className="w-32"
              min={1.0}
              max={2.0}
              step={0.1}
              value={[localSettings.lineHeight ?? 1.4]}
              onValueChange={([value]) => updateSetting('lineHeight', value)}
            />
          </SettingRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Automation
          </CardTitle>
          <CardDescription>Triggers and aliases processing</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingRow label="Enable Triggers" description="Run trigger scripts on incoming text">
            <Switch
              data-testid="switch-triggers-enabled"
              checked={localSettings.triggersEnabled ?? true}
              onCheckedChange={(checked) => updateSetting('triggersEnabled', checked)}
            />
          </SettingRow>
          <SettingRow label="Enable Aliases" description="Expand alias commands before sending">
            <Switch
              data-testid="switch-aliases-enabled"
              checked={localSettings.aliasesEnabled ?? true}
              onCheckedChange={(checked) => updateSetting('aliasesEnabled', checked)}
            />
          </SettingRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            Connection
          </CardTitle>
          <CardDescription>Default connection behavior for new profiles</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingRow label="Auto-Reconnect" description="Automatically reconnect if disconnected">
            <Switch
              data-testid="switch-auto-reconnect"
              checked={localSettings.autoReconnect ?? true}
              onCheckedChange={(checked) => updateSetting('autoReconnect', checked)}
            />
          </SettingRow>
          <SettingRow label="Reconnect Delay" description="Seconds to wait before reconnecting">
            <Input
              data-testid="input-reconnect-delay"
              type="number"
              className="w-20"
              min={1}
              max={60}
              value={localSettings.reconnectDelay ?? 5}
              onChange={(e) => updateSetting('reconnectDelay', parseInt(e.target.value) || 5)}
            />
          </SettingRow>
          <SettingRow label="Keep Alive" description="Send periodic pings to prevent disconnect">
            <Switch
              data-testid="switch-keep-alive"
              checked={localSettings.keepAlive ?? false}
              onCheckedChange={(checked) => updateSetting('keepAlive', checked)}
            />
          </SettingRow>
          <SettingRow label="Keep Alive Interval" description="Seconds between keep-alive pings">
            <Input
              data-testid="input-keep-alive-interval"
              type="number"
              className="w-20"
              min={10}
              max={300}
              value={localSettings.keepAliveInterval ?? 60}
              onChange={(e) => updateSetting('keepAliveInterval', parseInt(e.target.value) || 60)}
            />
          </SettingRow>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileSettingsTab() {
  const { data: profiles, isLoading } = useProfiles();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Each MUD profile can override global settings. Use "null" values to inherit from global defaults.
      </p>
      
      {profiles?.map((profile) => (
        <Card key={profile.id} className="hover-elevate">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{profile.name}</CardTitle>
            <CardDescription>{profile.host}:{profile.port}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/play/${profile.id}`}>
              <Button variant="outline" size="sm" data-testid={`button-edit-profile-${profile.id}`}>
                Edit Profile Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}

      {profiles?.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No profiles configured. Create a profile from the home page to customize per-MUD settings.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function Settings() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12 font-mono">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center gap-4 border-b border-border pb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back-home">
              <ArrowLeft className="w-5 h-5" />
              <span className="sr-only">Back to Home</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-primary">
              <SettingsIcon className="w-8 h-8" />
              Settings
            </h1>
            <p className="text-muted-foreground">Configure global defaults and per-MUD overrides</p>
          </div>
        </header>

        <Tabs defaultValue="global" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="global" data-testid="tab-global-settings">Global Defaults</TabsTrigger>
            <TabsTrigger value="profiles" data-testid="tab-profile-settings">Per-MUD Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="global" className="mt-6">
            <GlobalSettingsTab />
          </TabsContent>
          <TabsContent value="profiles" className="mt-6">
            <ProfileSettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
