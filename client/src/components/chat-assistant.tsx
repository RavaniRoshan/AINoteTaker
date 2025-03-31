import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'ai', content: string }>>([
    { type: 'ai', content: 'Hi, I\'m Geni! How can I help you today?' }
  ]);
  const { toast } = useToast();

  const askGeni = useMutation({
    mutationFn: async (query: string) => {
      const res = await apiRequest('POST', '/api/ai/suggest', { 
        promptType: 'search',
        currentText: query
      });
      return res.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, { type: 'ai', content: data.suggestion || "I'm not sure how to help with that." }]);
      
      // Store in search history
      apiRequest('POST', '/api/search/history', {
        query,
        result: data.suggestion,
        isAiQuery: true
      }).catch(console.error);
    },
    onError: (error) => {
      console.error('Error asking Geni:', error);
      toast({
        title: "Couldn't get a response",
        description: "There was an error getting a response from Geni.",
        variant: "destructive"
      });
      setMessages(prev => [...prev, { type: 'ai', content: "Sorry, I encountered an error processing your request." }]);
    }
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { type: 'user', content: query }]);
    
    // Process the query
    askGeni.mutate(query);
    
    // Reset input
    setQuery("");
  };

  return (
    <>
      {/* Floating chat button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-primary text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors z-50"
        aria-label="Open chat assistant"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles">
          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.2 1.2L3 12l5.9 1.9a2 2 0 0 1 1.2 1.2L12 21l1.9-5.9a2 2 0 0 1 1.2-1.2L21 12l-5.9-1.9a2 2 0 0 1-1.2-1.2L12 3Z"></path>
        </svg>
      </button>

      {/* Chat interface */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 flex flex-col h-[500px] max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles text-primary">
                  <path d="m12 3-1.9 5.8a2 2 0 0 1-1.2 1.2L3 12l5.9 1.9a2 2 0 0 1 1.2 1.2L12 21l1.9-5.9a2 2 0 0 1 1.2-1.2L21 12l-5.9-1.9a2 2 0 0 1-1.2-1.2L12 3Z"></path>
                </svg>
                <h3 className="font-semibold">Geni Assistant</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === 'user' 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              
              {askGeni.isPending && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 rounded-lg p-3 max-w-[80%]">
                    <div className="flex items-center space-x-2">
                      <div className="animate-pulse flex space-x-1">
                        <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                        <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                        <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  placeholder="Ask Geni something..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  size="icon"
                  disabled={askGeni.isPending || !query.trim()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send">
                    <path d="m22 2-7 20-4-9-9-4Z"></path>
                    <path d="M22 2 11 13"></path>
                  </svg>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}