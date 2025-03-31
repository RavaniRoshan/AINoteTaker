import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import EditorPage from "@/pages/editor";
import Settings from "@/pages/settings";
import { ChatAssistant } from "@/components/chat-assistant";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/new" component={EditorPage} />
      <Route path="/note/:id" component={EditorPage} />
      <Route path="/category/:id" component={Home} />
      <Route path="/favorites" component={Home} />
      <Route path="/tasks" component={Home} />
      <Route path="/trash" component={Home} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <ChatAssistant />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
