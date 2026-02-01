import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Play from "@/pages/Play";
import Settings from "@/pages/Settings";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/play/:id" component={Play} />
      <Route path="/settings" component={Settings} />
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
