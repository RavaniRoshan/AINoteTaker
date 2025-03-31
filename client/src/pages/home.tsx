import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type Note } from '@shared/schema';
import { format } from 'date-fns';

interface NotesListProps {
  title: string;
  apiPath: string;
  emptyMessage: string;
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { data: notes, isLoading } = useQuery<Note[]>({ 
    queryKey: ['/api/notes']
  });
  
  const filteredNotes = notes && Array.isArray(notes)
    ? notes.filter((note: Note) => 
        note.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];
  
  return (
    <AppLayout>
      {/* Notes Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">My Notes</h2>
            <p className="text-sm text-gray-500">
              {isLoading ? 'Loading...' : `${filteredNotes.length} notes`}
            </p>
          </div>
          <div className="flex space-x-2">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search text-gray-400">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
              </span>
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="py-2 pl-10 pr-4 block w-full border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                placeholder="Search notes..."
              />
            </div>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
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
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-grid">
                <rect width="7" height="7" x="3" y="3" rx="1"></rect>
                <rect width="7" height="7" x="14" y="3" rx="1"></rect>
                <rect width="7" height="7" x="14" y="14" rx="1"></rect>
                <rect width="7" height="7" x="3" y="14" rx="1"></rect>
              </svg>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Notes Content */}
      <div className="p-6 overflow-auto pb-16">
        {isLoading ? (
          <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="h-48">
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredNotes.length > 0 ? (
          <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
            {filteredNotes.map((note: Note) => (
              <Link key={note.id} href={`/note/${note.id}`}>
                <a className="block h-full">
                  <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 h-full flex flex-col">
                      <div className="flex items-start justify-between">
                        <h3 className="text-lg font-medium text-gray-900 line-clamp-1">
                          {note.title}
                        </h3>
                        {note.isFavorite && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star text-yellow-500">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-500 mt-1 mb-2">
                        {format(new Date(note.updatedAt), 'MMM d, yyyy')}
                      </p>
                      
                      <div className="text-sm text-gray-700 line-clamp-3 flex-grow">
                        {/* Would use a function to extract plain text from the content */}
                        {note.content ? (() => {
                          try {
                            const content = JSON.parse(note.content);
                            const text = content?.content?.[0]?.content?.[0]?.text || '';
                            return text.substring(0, 120) + (text.length > 120 ? '...' : '');
                          } catch (e) {
                            return note.content.substring(0, 120) + (note.content.length > 120 ? '...' : '');
                          }
                        })() : ''}
                      </div>
                      
                      <div className="flex mt-4 space-x-2">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                          Note
                        </span>
                        {/* Would need to check if note has tasks */}
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          Tasks
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text mx-auto text-gray-400 mb-4">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" x2="8" y1="13" y2="13"></line>
              <line x1="16" x2="8" y1="17" y2="17"></line>
              <line x1="10" x2="8" y1="9" y2="9"></line>
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notes found</h3>
            {searchTerm ? (
              <p className="text-gray-500">Try using different search terms.</p>
            ) : (
              <div>
                <p className="text-gray-500 mb-4">Create your first note to get started.</p>
                <Link href="/new">
                  <a className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg shadow hover:bg-primary/90 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus mr-2">
                      <path d="M5 12h14"></path>
                      <path d="M12 5v14"></path>
                    </svg>
                    <span>Create New Note</span>
                  </a>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
