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
import { ArrowLeft, Settings as SettingsIcon, Volume2, Eye, Zap, Wifi, Loader2, Bot, Key, Lock, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  encryptApiKey, 
  decryptApiKey, 
  storeApiKeyLocal, 
  getApiKeyLocal, 
  clearApiKey, 
  getStorageMode, 
  type StorageMode 
} from "@/lib/crypto-utils";

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
          <SettingRow label="Strip Symbols" description="Remove decorative symbols for screen readers (box art, lines, etc.)">
            <Switch
              data-testid="switch-strip-symbols"
              checked={localSettings.stripSymbols ?? false}
              onCheckedChange={(checked) => updateSetting('stripSymbols', checked)}
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
          <SettingRow label="Enable GMCP" description="Receive structured data from MUD (vitals, room info)">
            <Switch
              data-testid="switch-gmcp-enabled"
              checked={localSettings.gmcpEnabled ?? true}
              onCheckedChange={(checked) => updateSetting('gmcpEnabled', checked)}
            />
          </SettingRow>
        </CardContent>
      </Card>

      <AIKeySettings />
    </div>
  );
}

function AIKeySettings() {
  const { toast } = useToast();
  const [storageMode, setStorageMode] = useState<StorageMode>('none');
  const [apiKey, setApiKey] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [unlockPassword, setUnlockPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'local' | 'encrypted'>('local');

  useEffect(() => {
    const mode = getStorageMode();
    setStorageMode(mode);
    if (mode === 'local') {
      const key = getApiKeyLocal();
      if (key) {
        setApiKey(key);
        setIsUnlocked(true);
      }
    }
  }, []);

  const handleSaveLocal = () => {
    if (!apiKey.trim()) {
      toast({ title: "Error", description: "Please enter an API key", variant: "destructive" });
      return;
    }
    storeApiKeyLocal(apiKey);
    setStorageMode('local');
    setIsUnlocked(true);
    toast({ title: "API Key Saved", description: "Your key is stored locally in your browser." });
  };

  const handleSaveEncrypted = async () => {
    if (!apiKey.trim()) {
      toast({ title: "Error", description: "Please enter an API key", variant: "destructive" });
      return;
    }
    if (!password || password.length < 4) {
      toast({ title: "Error", description: "Password must be at least 4 characters", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    
    await encryptApiKey(apiKey, password);
    setStorageMode('encrypted');
    setIsUnlocked(true);
    setPassword('');
    setConfirmPassword('');
    toast({ title: "API Key Encrypted", description: "Your key is encrypted and stored securely." });
  };

  const handleUnlock = async () => {
    const key = await decryptApiKey(unlockPassword);
    if (key) {
      setApiKey(key);
      setIsUnlocked(true);
      setUnlockPassword('');
      toast({ title: "Unlocked", description: "Your API key is now available for this session." });
    } else {
      toast({ title: "Error", description: "Incorrect password", variant: "destructive" });
    }
  };

  const handleClear = () => {
    clearApiKey();
    setStorageMode('none');
    setApiKey('');
    setPassword('');
    setConfirmPassword('');
    setUnlockPassword('');
    setIsUnlocked(false);
    toast({ title: "API Key Removed", description: "Your stored key has been deleted." });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          AI Scripting Assistant
        </CardTitle>
        <CardDescription>
          Store your OpenAI API key to enable AI-powered script generation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {storageMode === 'none' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="api-key">OpenAI API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                data-testid="input-ai-api-key"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Storage Method</Label>
              <Select value={selectedMode} onValueChange={(v) => setSelectedMode(v as 'local' | 'encrypted')}>
                <SelectTrigger data-testid="select-storage-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Local Storage (convenient)
                    </div>
                  </SelectItem>
                  <SelectItem value="encrypted">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password Protected (secure)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {selectedMode === 'local' 
                  ? "Key stored unencrypted in browser. Convenient but accessible if someone has your device."
                  : "Key encrypted with a password. You'll need to enter the password each session."}
              </p>
            </div>

            {selectedMode === 'encrypted' && (
              <div className="space-y-2">
                <Label htmlFor="password">Encryption Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Choose a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-encryption-password"
                />
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  data-testid="input-confirm-password"
                />
              </div>
            )}

            <Button 
              onClick={selectedMode === 'local' ? handleSaveLocal : handleSaveEncrypted}
              data-testid="button-save-api-key"
            >
              Save API Key
            </Button>
          </>
        )}

        {storageMode === 'encrypted' && !isUnlocked && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="w-4 h-4" />
              Your API key is encrypted
            </div>
            <div className="space-y-2">
              <Label htmlFor="unlock-password">Enter Password to Unlock</Label>
              <div className="flex gap-2">
                <Input
                  id="unlock-password"
                  type="password"
                  placeholder="Password"
                  value={unlockPassword}
                  onChange={(e) => setUnlockPassword(e.target.value)}
                  data-testid="input-unlock-password"
                />
                <Button onClick={handleUnlock} data-testid="button-unlock">Unlock</Button>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleClear} data-testid="button-clear-key">
              <Trash2 className="w-4 h-4 mr-2" />
              Remove Key
            </Button>
          </div>
        )}

        {(storageMode === 'local' || (storageMode === 'encrypted' && isUnlocked)) && isUnlocked && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <Key className="w-4 h-4" />
              API key {storageMode === 'encrypted' ? 'unlocked for this session' : 'saved locally'}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleClear} data-testid="button-clear-key">
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Key
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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
