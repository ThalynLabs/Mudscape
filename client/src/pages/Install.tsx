import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { TerminalSquare, Check, Copy, ChevronRight, ChevronLeft, Server, Database, Key, Play, ArrowLeft, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type InstallMethod = 'docker' | 'nodejs' | null;

export default function Install() {
  const [step, setStep] = useState(0);
  const [method, setMethod] = useState<InstallMethod>(null);
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const CodeBlock = ({ code, language = "bash" }: { code: string; language?: string }) => (
    <div className="relative group">
      <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto font-mono">
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
  );

  const steps = [
    { title: "Welcome", icon: TerminalSquare },
    { title: "Choose Method", icon: Server },
    { title: "Database Setup", icon: Database },
    { title: "Configuration", icon: Key },
    { title: "Start Server", icon: Play },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-mono">
      <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TerminalSquare className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold text-primary">Mudscape Installation</span>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to App
            </Button>
          </Link>
        </header>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
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
                  Run your own private instance of Mudscape on your server or computer.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">What You'll Get</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <span>Full control over your data and profiles</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <span>No account required - use locally or share with friends</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <span>All accessibility features work offline</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <span>Customize and extend the source code</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Requirements</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>A computer or server running Linux, macOS, or Windows</li>
                    <li>PostgreSQL database (we'll help you set this up)</li>
                    <li>About 500MB of disk space</li>
                  </ul>
                </div>

                <Button onClick={() => setStep(1)} className="w-full" data-testid="button-start-install">
                  Let's Get Started
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
                  Pick the method that works best for your setup.
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
                    Easiest setup - just run one command. Works on any system with Docker installed.
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
                    More control - requires Node.js 20+ and npm. Good for development.
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
                <CardTitle>Database Setup</CardTitle>
                <CardDescription>
                  Mudscape uses PostgreSQL to store your profiles and settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {method === 'docker' ? (
                  <>
                    <div className="space-y-3">
                      <h3 className="font-semibold">Option A: Use Docker Compose (Easiest)</h3>
                      <p className="text-sm text-muted-foreground">
                        Our Docker Compose file includes PostgreSQL automatically.
                      </p>
                      <CodeBlock code={`# Create a folder for Mudscape
mkdir mudscape && cd mudscape

# Download docker-compose.yml
curl -O https://raw.githubusercontent.com/your-repo/mudscape/main/docker-compose.yml

# This file includes both Mudscape and PostgreSQL`} />
                    </div>

                    <div className="border-t pt-4 space-y-3">
                      <h3 className="font-semibold">Option B: Use Existing PostgreSQL</h3>
                      <p className="text-sm text-muted-foreground">
                        If you already have PostgreSQL running, you'll provide the connection string in the next step.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <h3 className="font-semibold">Install PostgreSQL</h3>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium">On macOS (with Homebrew):</p>
                        <CodeBlock code={`brew install postgresql@16
brew services start postgresql@16`} />
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">On Ubuntu/Debian:</p>
                        <CodeBlock code={`sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql`} />
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">On Windows:</p>
                        <p className="text-sm text-muted-foreground">
                          Download from{" "}
                          <a
                            href="https://www.postgresql.org/download/windows/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            postgresql.org
                            <ExternalLink className="w-3 h-3 inline ml-1" />
                          </a>
                        </p>
                      </div>
                    </div>

                    <div className="border-t pt-4 space-y-3">
                      <h3 className="font-semibold">Create Database</h3>
                      <CodeBlock code={`# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE mudscape;
CREATE USER mudscape WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE mudscape TO mudscape;
\\q`} />
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setStep(1)} data-testid="button-back">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)} className="flex-1" data-testid="button-next">
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
                <CardTitle>Configuration</CardTitle>
                <CardDescription>
                  Set up your environment variables.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {method === 'docker' ? (
                  <>
                    <div className="space-y-3">
                      <h3 className="font-semibold">Create .env file</h3>
                      <p className="text-sm text-muted-foreground">
                        Create a file called <code className="bg-muted px-1 rounded">.env</code> in your mudscape folder:
                      </p>
                      <CodeBlock code={`# Database (if using Docker Compose, this is pre-configured)
DATABASE_URL=postgresql://mudscape:your-password@db:5432/mudscape

# Session secret (generate a random string)
SESSION_SECRET=your-random-secret-here-make-it-long

# Optional: Port to run on (default 5000)
PORT=5000`} />
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm">
                        <strong>Tip:</strong> Generate a secure session secret with:
                      </p>
                      <CodeBlock code="openssl rand -base64 32" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <h3 className="font-semibold">Clone and Install</h3>
                      <CodeBlock code={`# Clone the repository
git clone https://github.com/your-repo/mudscape.git
cd mudscape

# Install dependencies
npm install`} />
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold">Create .env file</h3>
                      <CodeBlock code={`# Database connection
DATABASE_URL=postgresql://mudscape:your-password@localhost:5432/mudscape

# Session secret (generate a random string)
SESSION_SECRET=your-random-secret-here-make-it-long

# Port (optional)
PORT=5000`} />
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold">Initialize Database</h3>
                      <CodeBlock code={`# Push database schema
npm run db:push`} />
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setStep(2)} data-testid="button-back">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={() => setStep(4)} className="flex-1" data-testid="button-next">
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
                <CardTitle>Start Your Server</CardTitle>
                <CardDescription>
                  You're almost there! Let's start Mudscape.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {method === 'docker' ? (
                  <>
                    <div className="space-y-3">
                      <h3 className="font-semibold">Start with Docker Compose</h3>
                      <CodeBlock code={`# Start Mudscape and PostgreSQL
docker-compose up -d

# View logs
docker-compose logs -f mudscape`} />
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold">Or use Docker directly</h3>
                      <CodeBlock code={`docker run -d \\
  --name mudscape \\
  -p 5000:5000 \\
  -e DATABASE_URL=your-database-url \\
  -e SESSION_SECRET=your-session-secret \\
  ghcr.io/your-repo/mudscape:latest`} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <h3 className="font-semibold">Development Mode</h3>
                      <CodeBlock code={`# Start with hot reloading
npm run dev`} />
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold">Production Mode</h3>
                      <CodeBlock code={`# Build for production
npm run build

# Start production server
npm start`} />
                    </div>
                  </>
                )}

                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <h3 className="font-semibold text-primary mb-2">You're Done!</h3>
                  <p className="text-sm text-muted-foreground">
                    Open{" "}
                    <code className="bg-muted px-1 rounded">http://localhost:5000</code>{" "}
                    in your browser to access Mudscape.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold">What's Next?</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      Create your first connection to a MUD
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      Set up triggers and aliases for automation
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      Configure speech settings for accessibility
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      Import packages from other MUD clients
                    </li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setStep(3)} data-testid="button-back">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
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
          </Link>{" "}
          or ask in our community.
        </div>
      </div>
    </div>
  );
}
