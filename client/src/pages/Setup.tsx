import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useInstallStatus } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings, User, Users } from "lucide-react";

export default function Setup() {
  const [, setLocation] = useLocation();
  const { data: status, isLoading } = useInstallStatus();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState(1);
  const [accountMode, setAccountMode] = useState<"single" | "multi">("multi");
  const [appName, setAppName] = useState("Mudscape");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const setupMutation = useMutation({
    mutationFn: async (data: {
      accountMode: string;
      appName: string;
      adminUsername?: string;
      adminPassword?: string;
    }) => {
      const res = await apiRequest("POST", "/api/install/setup", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/install/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
      toast({
        title: "Setup complete!",
        description: "Mudscape has been configured successfully.",
      });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Setup failed",
        description: error instanceof Error ? error.message : "Could not complete setup",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (status?.installed) {
    setLocation("/");
    return null;
  }

  const handleNext = () => {
    if (step === 1 && accountMode === "single") {
      setupMutation.mutate({ accountMode, appName });
    } else if (step === 1 && accountMode === "multi") {
      setStep(2);
    } else if (step === 2) {
      if (!adminUsername.trim() || adminUsername.trim().length < 3) {
        toast({
          title: "Error",
          description: "Username must be at least 3 characters",
          variant: "destructive",
        });
        return;
      }
      if (!adminPassword || adminPassword.length < 6) {
        toast({
          title: "Error",
          description: "Password must be at least 6 characters",
          variant: "destructive",
        });
        return;
      }
      if (adminPassword !== confirmPassword) {
        toast({
          title: "Error",
          description: "Passwords do not match",
          variant: "destructive",
        });
        return;
      }
      setupMutation.mutate({
        accountMode,
        appName,
        adminUsername: adminUsername.trim(),
        adminPassword,
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Settings className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to Mudscape</CardTitle>
          <CardDescription>
            {step === 1 && "Let's set up your MUD client"}
            {step === 2 && "Create your admin account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="appName">Application Name</Label>
                <Input
                  id="appName"
                  data-testid="input-app-name"
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="Mudscape"
                />
              </div>
              
              <div className="space-y-3">
                <Label>Account Mode</Label>
                <RadioGroup
                  value={accountMode}
                  onValueChange={(v) => setAccountMode(v as "single" | "multi")}
                  className="space-y-3"
                >
                  <div className="flex items-start space-x-3 p-3 border rounded-md hover-elevate cursor-pointer">
                    <RadioGroupItem value="single" id="single" data-testid="radio-single-user" />
                    <div className="flex-1">
                      <Label htmlFor="single" className="cursor-pointer flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Single User Mode
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        No login required. Perfect for personal use on a single computer.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 border rounded-md hover-elevate cursor-pointer">
                    <RadioGroupItem value="multi" id="multi" data-testid="radio-multi-user" />
                    <div className="flex-1">
                      <Label htmlFor="multi" className="cursor-pointer flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Multi-User Mode
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Users must log in. Profiles are private to each user. First account is admin.
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-muted-foreground">
                Create the administrator account. This account will have full access to manage users and settings.
              </p>
              <div className="space-y-2">
                <Label htmlFor="adminUsername">Admin Username</Label>
                <Input
                  id="adminUsername"
                  data-testid="input-admin-username"
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminPassword">Admin Password</Label>
                <Input
                  id="adminPassword"
                  data-testid="input-admin-password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  data-testid="input-confirm-admin-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                />
              </div>
            </>
          )}

          <div className="flex gap-2">
            {step === 2 && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep(1)}
                disabled={setupMutation.isPending}
                data-testid="button-back"
              >
                Back
              </Button>
            )}
            <Button
              className="flex-1"
              onClick={handleNext}
              disabled={setupMutation.isPending}
              data-testid="button-next"
            >
              {setupMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : step === 1 && accountMode === "multi" ? (
                "Next"
              ) : (
                "Complete Setup"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
