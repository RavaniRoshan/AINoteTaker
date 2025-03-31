import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TextEditor } from './text-editor';
import { TodoList } from './todo-list';
import { AiSuggestion } from './ai-suggestion';
import { type Note, type Task } from '@shared/schema';
import { parseEditorContent, getPlainTextFromContent } from '@/lib/editor';

interface NoteEditorProps {
  noteId?: number;
}

export function NoteEditor({ noteId }: NoteEditorProps) {
  const [title, setTitle] = useState('Untitled');
  const [content, setContent] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestionType, setSuggestionType] = useState<'writing' | 'task' | 'structure'>('writing');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [requestingSuggestion, setRequestingSuggestion] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Fetch note if we have a noteId
  const { data: note, isLoading: isNoteLoading } = useQuery({
    queryKey: noteId ? [`/api/notes/${noteId}`] : null,
    enabled: !!noteId
  });

  // Fetch tasks for this note if we have a noteId
  const { data: tasks } = useQuery({
    queryKey: noteId ? [`/api/notes/${noteId}/tasks`] : null,
    enabled: !!noteId
  });

  // Create or update note mutation
  const saveNote = useMutation({
    mutationFn: async (noteData: { title: string; content: string }) => {
      if (noteId) {
        const res = await apiRequest('PUT', `/api/notes/${noteId}`, noteData);
        return res.json();
      } else {
        const res = await apiRequest('POST', '/api/notes', {
          ...noteData,
          isFavorite: false,
          isArchived: false
        });
        return res.json();
      }
    },
    onSuccess: (data) => {
      if (!noteId) {
        // If we created a new note, update the URL
        window.history.replaceState(null, '', `/note/${data.id}`);
      }
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      if (noteId) {
        queryClient.invalidateQueries({ queryKey: [`/api/notes/${noteId}`] });
      }
    }
  });

  // AI suggestion mutation
  const requestAiSuggestion = useMutation({
    mutationFn: async ({ promptType, currentText, noteTitle, existingTasks }: {
      promptType: 'writing' | 'task' | 'structure';
      currentText: string;
      noteTitle: string;
      existingTasks?: string[];
    }) => {
      const res = await apiRequest('POST', '/api/ai/suggest', {
        promptType,
        currentText,
        noteTitle,
        existingTasks
      });
      return res.json();
    },
    onSuccess: (data) => {
      setAiSuggestion(data.suggestion);
      setShowSuggestion(true);
      setRequestingSuggestion(false);
    },
    onError: () => {
      setRequestingSuggestion(false);
    }
  });

  // Set initial data from note if available
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setLastSaved(new Date(note.updatedAt));
    }
  }, [note]);

  // Auto save note when content changes (debounced)
  useEffect(() => {
    if (!title || isNoteLoading) return;
    
    const timer = setTimeout(() => {
      saveNote.mutate({ title, content });
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [title, content]);

  const handleRequestSuggestion = (type: 'writing' | 'task' | 'structure') => {
    setRequestingSuggestion(true);
    setSuggestionType(type);
    
    const plainText = getPlainTextFromContent(content);
    const taskDescriptions = tasks?.map((task: Task) => task.description) || [];
    
    requestAiSuggestion.mutate({
      promptType: type,
      currentText: plainText,
      noteTitle: title,
      existingTasks: taskDescriptions
    });
  };

  const handleAcceptSuggestion = () => {
    // For writing suggestions, append to the content
    if (suggestionType === 'writing') {
      try {
        const parsedContent = parseEditorContent(content);
        
        // Try to append to the last paragraph if it exists
        if (parsedContent.content && parsedContent.content.length > 0) {
          const lastParagraphIndex = parsedContent.content
            .map((item: any, index: number) => item.type === 'paragraph' ? index : -1)
            .filter((index: number) => index !== -1)
            .pop();
          
          if (lastParagraphIndex !== undefined) {
            if (!parsedContent.content[lastParagraphIndex].content) {
              parsedContent.content[lastParagraphIndex].content = [];
            }
            
            // Add a space if the last paragraph doesn't end with one
            const lastContent = parsedContent.content[lastParagraphIndex].content;
            if (lastContent.length > 0 && lastContent[lastContent.length - 1].text) {
              const lastText = lastContent[lastContent.length - 1].text;
              if (!lastText.endsWith(' ')) {
                lastContent[lastContent.length - 1].text += ' ';
              }
            }
            
            // Add the suggestion
            parsedContent.content[lastParagraphIndex].content.push({
              type: 'text',
              text: aiSuggestion
            });
          } else {
            // If no paragraph exists, add a new one
            parsedContent.content.push({
              type: 'paragraph',
              content: [{ type: 'text', text: aiSuggestion }]
            });
          }
        } else {
          // If content is empty, create a new document structure
          parsedContent.content = [{
            type: 'paragraph',
            content: [{ type: 'text', text: aiSuggestion }]
          }];
        }
        
        setContent(JSON.stringify(parsedContent));
      } catch (e) {
        // If parsing fails, just append the text
        setContent(content + '\n\n' + aiSuggestion);
      }
    }
    
    // For task suggestions, create a new task
    if (suggestionType === 'task' && noteId) {
      apiRequest('POST', `/api/notes/${noteId}/tasks`, {
        description: aiSuggestion,
        completed: false
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: [`/api/notes/${noteId}/tasks`] });
      });
    }
    
    setShowSuggestion(false);
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 my-6">
        {/* Note Header */}
        <div className="px-6 py-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            className="block w-full text-2xl font-semibold text-gray-900 border-0 p-0 focus:outline-none focus:ring-0"
          />
        </div>
        
        {/* Editor Toolbar */}
        <div className="border-t border-b border-gray-200 px-4 py-2 flex flex-wrap items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
            onClick={() => {
              const editor = document.querySelector('.ProseMirror');
              if (editor) {
                // This is just a simple implementation; in a real app, you would integrate
                // directly with the TipTap editor API
                document.execCommand('bold');
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bold">
              <path d="M14 12a4 4 0 0 0 0-8H6v8"></path>
              <path d="M15 20a4 4 0 0 0 0-8H6v8Z"></path>
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-italic">
              <line x1="19" x2="10" y1="4" y2="4"></line>
              <line x1="14" x2="5" y1="20" y2="20"></line>
              <line x1="15" x2="9" y1="4" y2="20"></line>
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-underline">
              <path d="M6 4v6a6 6 0 0 0 12 0V4"></path>
              <line x1="4" x2="20" y1="20" y2="20"></line>
            </svg>
          </Button>
          
          <span className="h-4 w-px bg-gray-300 mx-1"></span>
          
          <Button
            variant="ghost"
            size="sm"
            className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list">
              <line x1="8" x2="21" y1="6" y2="6"></line>
              <line x1="8" x2="21" y1="12" y2="12"></line>
              <line x1="8" x2="21" y1="18" y2="18"></line>
              <line x1="3" x2="3" y1="6" y2="6"></line>
              <line x1="3" x2="3" y1="12" y2="12"></line>
              <line x1="3" x2="3" y1="18" y2="18"></line>
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list-ordered">
              <line x1="10" x2="21" y1="6" y2="6"></line>
              <line x1="10" x2="21" y1="12" y2="12"></line>
              <line x1="10" x2="21" y1="18" y2="18"></line>
              <path d="M4 6h1v4"></path>
              <path d="M4 10h2"></path>
              <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-square">
              <polyline points="9 11 12 14 22 4"></polyline>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
          </Button>
          
          <span className="h-4 w-px bg-gray-300 mx-1"></span>
          
          <Button
            variant="ghost"
            size="sm"
            className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
              <circle cx="9" cy="9" r="2"></circle>
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-code">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
          </Button>
          
          <div className="ml-auto flex items-center">
            <div className="relative">
              <Button
                disabled={requestingSuggestion}
                onClick={() => handleRequestSuggestion('writing')}
                size="sm"
                className="flex items-center px-3 py-1 text-sm text-primary bg-primary/10 rounded-full hover:bg-primary/20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles mr-1">
                  <path d="m12 3-1.9 5.8a2 2 0 0 1-1.2 1.2L3 12l5.9 1.9a2 2 0 0 1 1.2 1.2L12 21l1.9-5.9a2 2 0 0 1 1.2-1.2L21 12l-5.9-1.9a2 2 0 0 1-1.2-1.2L12 3Z"></path>
                </svg>
                <span>{requestingSuggestion ? 'Thinking...' : 'AI Suggest'}</span>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Note Content */}
        <div className="px-6 py-4">
          <div className="mt-4 space-y-4 editor-content">
            <TextEditor
              content={content}
              onChange={setContent}
              placeholder="Start writing here..."
            />
            
            {/* AI Suggestion */}
            {showSuggestion && (
              <AiSuggestion
                suggestion={aiSuggestion}
                onAccept={handleAcceptSuggestion}
                onDismiss={() => setShowSuggestion(false)}
              />
            )}
            
            {/* Tasks */}
            {noteId && (
              <TodoList noteId={noteId} tasks={tasks || []} />
            )}
          </div>
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="bg-white border-t border-gray-200 px-6 py-2 flex items-center justify-between text-xs text-gray-500 fixed bottom-0 left-0 right-0 md:left-64">
        <div className="flex items-center space-x-4">
          <span>
            {lastSaved ? (
              `Last edited: ${lastSaved.toLocaleString()}`
            ) : (
              'Not saved yet'
            )}
          </span>
          {saveNote.isPending ? (
            <span>Saving...</span>
          ) : (
            <span>Saved to cloud</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button className="flex items-center hover:text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-share mr-1">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
              <polyline points="16 6 12 2 8 6"></polyline>
              <line x1="12" x2="12" y1="2" y2="15"></line>
            </svg>
            <span>Share</span>
          </button>
          <button 
            className="flex items-center hover:text-primary"
            onClick={() => {
              if (noteId) {
                apiRequest('PUT', `/api/notes/${noteId}`, {
                  isFavorite: note?.isFavorite ? false : true
                }).then(() => {
                  queryClient.invalidateQueries({ queryKey: [`/api/notes/${noteId}`] });
                  queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
                });
              }
            }}
          >
            {note?.isFavorite ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star mr-1">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                <span>Favorited</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star mr-1">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                <span>Favorite</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
