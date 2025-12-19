
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";

import Calendar from "./pages/Calendar";
import Settings from "./pages/Settings";
import Logs from "./pages/Logs";
import Users from "./pages/Users";
import Rooms from "./pages/Rooms";
import NotFound from "./pages/NotFound";
import { initializeDatabase } from "./lib/dbService";
import { testSupabaseConnection } from "./lib/testSupabaseConnection";
import { debugDatabase } from "./lib/debugDatabase";
import { debugUserCreation } from "./lib/debugUserCreation";
import { debugCreateUser } from "./lib/debugCreateUser";

// Initialize CSS variables for the sidebar
import "./styles/sidebar.css";

const queryClient = new QueryClient();

const App = () => {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      // Test Supabase connection
      await testSupabaseConnection();
      
      // Debug database operations
      await debugDatabase();
      
      // Debug user creation specifically
      await debugUserCreation();
      
      // Debug createUser API function directly
      await debugCreateUser();
      
      // Initialize database
      await initializeDatabase();
      setIsInitializing(false);
    };

    initialize();
  }, []);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-guardian-yellow"></div>
        <span className="ml-3 text-lg">Connecting to database...</span>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="w-full min-h-screen">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/users" element={<Users />} />
              <Route path="/rooms" element={<Rooms />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
