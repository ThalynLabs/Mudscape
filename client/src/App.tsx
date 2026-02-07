import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth, useInstallStatus } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Play from "@/pages/Play";
import Settings from "@/pages/Settings";
import Install from "@/pages/Install";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Admin from "@/pages/Admin";
import GettingStarted from "@/pages/help/GettingStarted";
import Speech from "@/pages/help/Speech";
import Keyboard from "@/pages/help/Keyboard";
import Commands from "@/pages/help/Commands";
import Scripting from "@/pages/help/Scripting";
import Automation from "@/pages/help/Automation";
import Sounds from "@/pages/help/Sounds";
import Packages from "@/pages/help/Packages";
import AIAssistant from "@/pages/help/AIAssistant";
import SettingsHelp from "@/pages/help/SettingsHelp";
import PackageRepo from "@/pages/PackageRepo";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading, accountMode } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (accountMode === "single") {
    return <Component />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading, user, accountMode } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (accountMode === "single") {
    return <Component />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (!user?.isAdmin) {
    return <Redirect to="/" />;
  }

  return <Component />;
}

function SetupCheck({ children }: { children: React.ReactNode }) {
  const { data: status, isLoading } = useInstallStatus();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!status?.installed) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}

function Router() {
  return (
    <SetupCheck>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/install" component={Install} />
        <Route path="/">
          <ProtectedRoute component={Home} />
        </Route>
        <Route path="/play/:id">
          <ProtectedRoute component={Play} />
        </Route>
        <Route path="/settings">
          <ProtectedRoute component={Settings} />
        </Route>
        <Route path="/admin">
          <AdminRoute component={Admin} />
        </Route>
        <Route path="/packages">
          <ProtectedRoute component={PackageRepo} />
        </Route>
        <Route path="/help" component={GettingStarted} />
        <Route path="/help/speech" component={Speech} />
        <Route path="/help/keyboard" component={Keyboard} />
        <Route path="/help/commands" component={Commands} />
        <Route path="/help/scripting" component={Scripting} />
        <Route path="/help/automation" component={Automation} />
        <Route path="/help/sounds" component={Sounds} />
        <Route path="/help/packages" component={Packages} />
        <Route path="/help/ai-assistant" component={AIAssistant} />
        <Route path="/help/settings" component={SettingsHelp} />
        <Route component={NotFound} />
      </Switch>
    </SetupCheck>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
