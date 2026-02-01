import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { TerminalSquare, Check, Copy, ChevronRight, ChevronLeft, Server, Database, Key, Play, ArrowLeft, RefreshCw, Eye, EyeOff, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type InstallMethod = 'docker' | 'nodejs' | null;

interface ConfigValues {
  dbHost: string;
  dbPort: string;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  sessionSecret: string;
  appPort: string;
}

export default function Install() {
  const [step, setStep] = useState(0);
  const [method, setMethod] = useState<InstallMethod>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showDbPassword, setShowDbPassword] = useState(false);
  const { toast } = useToast();
  
  const [config, setConfig] = useState<ConfigValues>({
    dbHost: 'localhost',
    dbPort: '5432',
    dbName: 'mudscape',
    dbUser: 'mudscape',
    dbPassword: '',
    sessionSecret: '',
    appPort: '5000',
  });

  const updateConfig = (key: keyof ConfigValues, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const generateSessionSecret = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const secret = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    updateConfig('sessionSecret', secret);
    toast({ title: "Generated secure session secret" });
  };

  const generateDbPassword = () => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    const password = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    updateConfig('dbPassword', password);
    toast({ title: "Generated secure database password" });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const getDatabaseUrl = () => {
    const host = method === 'docker' ? 'db' : config.dbHost;
    return `postgresql://${config.dbUser}:${config.dbPassword}@${host}:${config.dbPort}/${config.dbName}`;
  };

  const getEnvFileContent = () => {
    return `DATABASE_URL=${getDatabaseUrl()}
SESSION_SECRET=${config.sessionSecret}
PORT=${config.appPort}`;
  };

  const getDockerComposeContent = () => {
    return `version: '3.8'
services:
  mudscape:
    image: ghcr.io/your-repo/mudscape:latest
    ports:
      - "${config.appPort}:5000"
    environment:
      - DATABASE_URL=postgresql://${config.dbUser}:${config.dbPassword}@db:5432/${config.dbName}
      - SESSION_SECRET=${config.sessionSecret}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=${config.dbUser}
      - POSTGRES_PASSWORD=${config.dbPassword}
      - POSTGRES_DB=${config.dbName}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:`;
  };

  const getCreateDbCommands = () => {
    return `CREATE DATABASE ${config.dbName};
CREATE USER ${config.dbUser} WITH PASSWORD '${config.dbPassword}';
GRANT ALL PRIVILEGES ON DATABASE ${config.dbName} TO ${config.dbUser};`;
  };

  const CodeBlock = ({ code, label }: { code: string; label?: string }) => (
    <div className="space-y-1">
      {label && <Label className="text-xs text-muted-foreground">{label}</Label>}
      <div className="relative group">
        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto font-mono whitespace-pre-wrap break-all">
          <code>{code}</code>
        </pre>
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => copyToClipboard(code)}
          data-testid="button-copy-code"
        >
          <Copy className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  const steps = [
    { title: "Welcome", icon: TerminalSquare },
    { title: "Choose Method", icon: Server },
    { title: "Database", icon: Database },
    { title: "Configuration", icon: Key },
    { title: "Launch", icon: Play },
  ];

  const canProceedFromStep3 = config.dbPassword && config.sessionSecret;

  return (
    <div className="min-h-screen bg-background text-foreground font-mono">
      <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TerminalSquare className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold text-primary">Mudscape Setup Wizard</span>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to App
            </Button>
          </Link>
        </header>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 flex-wrap" role="progressbar" aria-valuenow={step + 1} aria-valuemax={5}>
          {steps.map((s, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                  ? "bg-muted text-muted-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {i < step ? (
                <Check className="w-4 h-4" />
              ) : (
                <s.icon className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{s.title}</span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card className="border-2">
          {step === 0 && (
            <>
              <CardHeader>
                <CardTitle className="text-2xl">Self-Host Mudscape</CardTitle>
                <CardDescription>
                  This wizard will help you configure and deploy your own Mudscape server.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">What This Wizard Does</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <span>Generates all configuration files for you</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <span>Creates secure passwords and secrets automatically</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <span>Provides ready-to-use commands for your setup</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <span>Works with Docker or standalone Node.js</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Requirements</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>A computer or server running Linux, macOS, or Windows</li>
                    <li>Docker (recommended) or Node.js 20+</li>
                    <li>About 500MB of disk space</li>
                  </ul>
                </div>

                <Button onClick={() => setStep(1)} className="w-full" data-testid="button-start-install">
                  Start Setup Wizard
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </>
          )}

          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle>Choose Installation Method</CardTitle>
                <CardDescription>
                  How would you like to run Mudscape?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <button
                  onClick={() => setMethod('docker')}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-colors hover-elevate ${
                    method === 'docker' ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                  data-testid="button-method-docker"
                >
                  <div className="font-semibold mb-1">Docker (Recommended)</div>
                  <div className="text-sm text-muted-foreground">
                    Everything runs in containers. Database included. Just one command to start.
                  </div>
                </button>

                <button
                  onClick={() => setMethod('nodejs')}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-colors hover-elevate ${
                    method === 'nodejs' ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                  data-testid="button-method-nodejs"
                >
                  <div className="font-semibold mb-1">Node.js (Manual)</div>
                  <div className="text-sm text-muted-foreground">
                    Run directly with Node.js. You'll need to set up PostgreSQL separately.
                  </div>
                </button>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setStep(0)} data-testid="button-back">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!method}
                    className="flex-1"
                    data-testid="button-next"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle>Database Configuration</CardTitle>
                <CardDescription>
                  {method === 'docker' 
                    ? "Configure your PostgreSQL database. Docker will create this automatically."
                    : "Enter your PostgreSQL connection details."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  {method === 'nodejs' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="dbHost">Database Host</Label>
                        <Input
                          id="dbHost"
                          value={config.dbHost}
                          onChange={(e) => updateConfig('dbHost', e.target.value)}
                          placeholder="localhost"
                          data-testid="input-db-host"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dbPort">Port</Label>
                        <Input
                          id="dbPort"
                          value={config.dbPort}
                          onChange={(e) => updateConfig('dbPort', e.target.value)}
                          placeholder="5432"
                          data-testid="input-db-port"
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="dbName">Database Name</Label>
                    <Input
                      id="dbName"
                      value={config.dbName}
                      onChange={(e) => updateConfig('dbName', e.target.value)}
                      placeholder="mudscape"
                      data-testid="input-db-name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dbUser">Database User</Label>
                    <Input
                      id="dbUser"
                      value={config.dbUser}
                      onChange={(e) => updateConfig('dbUser', e.target.value)}
                      placeholder="mudscape"
                      data-testid="input-db-user"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dbPassword">Database Password</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="dbPassword"
                        type={showDbPassword ? "text" : "password"}
                        value={config.dbPassword}
                        onChange={(e) => updateConfig('dbPassword', e.target.value)}
                        placeholder="Enter or generate a password"
                        data-testid="input-db-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowDbPassword(!showDbPassword)}
                      >
                        {showDbPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Button variant="outline" onClick={generateDbPassword} data-testid="button-generate-db-password">
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {method === 'docker' 
                      ? "This password will be used when Docker creates the database."
                      : "Use this password when creating your PostgreSQL database."}
                  </p>
                </div>

                {method === 'nodejs' && config.dbPassword && (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <h4 className="font-semibold text-sm">Create Database Commands</h4>
                    <p className="text-xs text-muted-foreground">
                      Run these in psql to create your database:
                    </p>
                    <CodeBlock code={getCreateDbCommands()} />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setStep(1)} data-testid="button-back">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!config.dbPassword}
                    className="flex-1"
                    data-testid="button-next"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle>Server Configuration</CardTitle>
                <CardDescription>
                  Configure your Mudscape server settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="appPort">Server Port</Label>
                  <Input
                    id="appPort"
                    value={config.appPort}
                    onChange={(e) => updateConfig('appPort', e.target.value)}
                    placeholder="5000"
                    data-testid="input-app-port"
                  />
                  <p className="text-xs text-muted-foreground">
                    The port Mudscape will listen on. Access it at http://localhost:{config.appPort}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sessionSecret">Session Secret</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="sessionSecret"
                        type={showPassword ? "text" : "password"}
                        value={config.sessionSecret}
                        onChange={(e) => updateConfig('sessionSecret', e.target.value)}
                        placeholder="Click Generate to create a secure secret"
                        data-testid="input-session-secret"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Button variant="outline" onClick={generateSessionSecret} data-testid="button-generate-secret">
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This secret encrypts user sessions. Keep it private and don't share it.
                  </p>
                </div>

                {canProceedFromStep3 && (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <h4 className="font-semibold text-sm">Your Configuration Files</h4>
                    
                    {method === 'docker' ? (
                      <>
                        <CodeBlock 
                          code={getDockerComposeContent()} 
                          label="docker-compose.yml - Save this file" 
                        />
                      </>
                    ) : (
                      <>
                        <CodeBlock 
                          code={getEnvFileContent()} 
                          label=".env file - Save this in your project root" 
                        />
                      </>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setStep(2)} data-testid="button-back">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(4)}
                    disabled={!canProceedFromStep3}
                    className="flex-1"
                    data-testid="button-next"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 4 && (
            <>
              <CardHeader>
                <CardTitle>Launch Your Server</CardTitle>
                <CardDescription>
                  Everything is configured. Here's how to start Mudscape.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {method === 'docker' ? (
                  <>
                    <div className="space-y-3">
                      <h3 className="font-semibold">Step 1: Save Your docker-compose.yml</h3>
                      <p className="text-sm text-muted-foreground">
                        Create a folder for Mudscape and save this file as <code className="bg-muted px-1 rounded">docker-compose.yml</code>:
                      </p>
                      <CodeBlock code={getDockerComposeContent()} />
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold">Step 2: Start the Server</h3>
                      <CodeBlock code={`cd your-mudscape-folder
docker-compose up -d`} />
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold">Step 3: Check Status</h3>
                      <CodeBlock code={`docker-compose ps
docker-compose logs -f mudscape`} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <h3 className="font-semibold">Step 1: Save Your .env File</h3>
                      <p className="text-sm text-muted-foreground">
                        In your Mudscape folder, create a file called <code className="bg-muted px-1 rounded">.env</code>:
                      </p>
                      <CodeBlock code={getEnvFileContent()} />
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold">Step 2: Install Dependencies</h3>
                      <CodeBlock code="npm install" />
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold">Step 3: Initialize Database</h3>
                      <CodeBlock code="npm run db:push" />
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold">Step 4: Start the Server</h3>
                      <CodeBlock code={`# Development mode
npm run dev

# Or production mode
npm run build && npm start`} />
                    </div>
                  </>
                )}

                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    You're Ready!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Once started, open{" "}
                    <code className="bg-muted px-1 rounded">http://localhost:{config.appPort}</code>{" "}
                    in your browser to access Mudscape.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold">Need to Stop?</h3>
                  {method === 'docker' ? (
                    <CodeBlock code="docker-compose down" />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Press <kbd className="bg-muted px-1 rounded">Ctrl+C</kbd> in the terminal.
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setStep(3)} data-testid="button-back">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button variant="outline" onClick={() => setStep(0)} data-testid="button-start-over">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Start Over
                  </Button>
                  <Link href="/" className="flex-1">
                    <Button className="w-full" data-testid="button-finish">
                      <Play className="w-4 h-4 mr-2" />
                      Go to Mudscape
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        {/* Help Link */}
        <div className="text-center text-sm text-muted-foreground">
          Need help?{" "}
          <Link href="/help" className="text-primary hover:underline">
            Check our documentation
          </Link>
        </div>
      </div>
    </div>
  );
}
