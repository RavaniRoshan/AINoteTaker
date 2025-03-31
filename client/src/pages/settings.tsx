import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from 'wouter';

export default function Settings() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Check for user authentication and navigate away if not authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await apiRequest('GET', '/api/auth/me');
      } catch (error) {
        if ((error as any).status === 401) {
          navigate('/', { replace: true });
        }
      }
    };
    checkAuth();
  }, [navigate]);

  const { data: user, isLoading: userLoading } = useQuery<{ username: string }>({
    queryKey: ['/api/auth/me']
  });

  const logout = useMutation({
    mutationFn: async () => {
      setIsLoggingOut(true);
      const res = await apiRequest('POST', '/api/auth/logout');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account."
      });
      // Clear all queries and redirect to home
      queryClient.clear();
      navigate('/', { replace: true });
      setIsLoggingOut(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to logout",
        description: "Please try again.",
        variant: "destructive"
      });
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  });

  const handleLogout = () => {
    logout.mutate();
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Account</h2>
          
          {userLoading ? (
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
            </div>
          ) : user ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Username</p>
                <p className="text-base font-semibold">{user.username}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Not logged in</p>
          )}
          
          <div className="mt-6 border-t border-gray-200 pt-4">
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </Button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">AI Assistant Settings</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Note Assistant</p>
              <p className="text-sm text-gray-600">
                The AI assistant helps you write better notes by suggesting content, 
                tasks, and structure as you work. It uses Google's Gemini AI model
                to provide intelligent suggestions.
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Search Assistant</p>
              <p className="text-sm text-gray-600 mb-1">
                The Geni search assistant helps find your notes and content using natural
                language search and AI capabilities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}