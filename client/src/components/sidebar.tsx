import { Link, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type Category } from '@shared/schema';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export function Sidebar({ onCloseMobile }: SidebarProps) {
  const [location] = useLocation();
  const [newCategoryDialog, setNewCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('blue-500');
  
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({ 
    queryKey: ['/api/categories']
  });
  
  const createCategory = useMutation({
    mutationFn: async (newCategory: { name: string, color: string, icon: string }) => {
      const res = await apiRequest('POST', '/api/categories', newCategory);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setNewCategoryDialog(false);
      setNewCategoryName('');
    }
  });
  
  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    
    createCategory.mutate({
      name: newCategoryName,
      color: newCategoryColor,
      icon: 'folder'
    });
  };
  
  const getColorClass = (color: string) => {
    switch (color) {
      case 'blue-500': return 'text-blue-500';
      case 'green-500': return 'text-green-500';
      case 'yellow-500': return 'text-yellow-500';
      case 'red-500': return 'text-red-500';
      case 'purple-500': return 'text-purple-500';
      default: return 'text-blue-500';
    }
  };
  
  return (
    <>
      <div className="flex flex-col h-full">
        <div className="p-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles text-primary">
              <path d="m12 3-1.9 5.8a2 2 0 0 1-1.2 1.2L3 12l5.9 1.9a2 2 0 0 1 1.2 1.2L12 21l1.9-5.9a2 2 0 0 1 1.2-1.2L21 12l-5.9-1.9a2 2 0 0 1-1.2-1.2L12 3Z"></path>
            </svg>
            <h1 className="text-xl font-semibold text-gray-800">NoteGenius</h1>
          </div>
          <button 
            onClick={onCloseMobile}
            className="text-gray-500 hover:text-gray-700 p-1 rounded md:hidden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
        </div>
        
        <div className="p-3">
          <Link href="/new">
            <a className="flex items-center justify-center w-full px-4 py-2 bg-primary text-white rounded-lg shadow hover:bg-primary/90 transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus mr-2">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg>
              <span>New Note</span>
            </a>
          </Link>
        </div>
        
        <nav className="px-3 py-2">
          <div className="space-y-1">
            <Link href="/">
              <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                location === '/' ? 'bg-gray-100 text-primary' : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text mr-3">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" x2="8" y1="13" y2="13"></line>
                  <line x1="16" x2="8" y1="17" y2="17"></line>
                  <line x1="10" x2="8" y1="9" y2="9"></line>
                </svg>
                <span>All Notes</span>
              </a>
            </Link>
            
            <Link href="/tasks">
              <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                location === '/tasks' ? 'bg-gray-100 text-primary' : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-square mr-3">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <span>Tasks</span>
              </a>
            </Link>
            
            <Link href="/favorites">
              <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                location === '/favorites' ? 'bg-gray-100 text-primary' : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star mr-3">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                <span>Favorites</span>
              </a>
            </Link>
            
            <Link href="/trash">
              <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                location === '/trash' ? 'bg-gray-100 text-primary' : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2 mr-3">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  <line x1="10" x2="10" y1="11" y2="17"></line>
                  <line x1="14" x2="14" y1="11" y2="17"></line>
                </svg>
                <span>Trash</span>
              </a>
            </Link>
          </div>
          
          <div className="mt-8">
            <div className="flex items-center justify-between px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <span>Categories</span>
              <button 
                onClick={() => setNewCategoryDialog(true)}
                className="hover:text-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus">
                  <path d="M5 12h14"></path>
                  <path d="M12 5v14"></path>
                </svg>
              </button>
            </div>
            
            <div className="mt-1 space-y-1">
              {categoriesLoading ? (
                <div className="px-3 py-2 text-sm text-gray-500">Loading categories...</div>
              ) : categories && categories.length > 0 ? (
                categories.map((category: Category) => (
                  <Link key={category.id} href={`/category/${category.id}`}>
                    <a className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      location === `/category/${category.id}` 
                        ? 'bg-gray-100 text-primary' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                    }`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-folder mr-3 ${getColorClass(category.color)}`}>
                        <path d="M20 20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h.5c.546 0 1.07-.217 1.45-.602l.6-.6A2.1 2.1 0 0 1 10 5h4c.536 0 1.048.214 1.426.586l.574.586c.38.385.904.602 1.45.602H18a2 2 0 0 1 2 2v9Z"></path>
                      </svg>
                      <span>{category.name}</span>
                    </a>
                  </Link>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">No categories found</div>
              )}
            </div>
          </div>
        </nav>
        
        <div className="mt-auto p-4 border-t border-gray-200">
          <Link href="/settings">
            <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              location === '/settings' ? 'bg-gray-100 text-primary' : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings mr-3">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span>Settings</span>
            </a>
          </Link>
        </div>
      </div>
      
      {/* New Category Dialog */}
      <Dialog open={newCategoryDialog} onOpenChange={setNewCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <label htmlFor="categoryName" className="block text-sm font-medium mb-1">
                Name
              </label>
              <Input
                id="categoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Color
              </label>
              <div className="flex space-x-2">
                {['blue-500', 'green-500', 'yellow-500', 'red-500', 'purple-500'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewCategoryColor(color)}
                    className={`w-8 h-8 rounded-full ${getColorClass(color)} border ${
                      newCategoryColor === color ? 'border-gray-800 ring-2 ring-offset-2 ring-opacity-50 ring-gray-300' : 'border-gray-300'
                    }`}
                  >
                    {newCategoryColor === color && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                        <path d="M20 6 9 17l-5-5"></path>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setNewCategoryDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              disabled={!newCategoryName.trim() || createCategory.isPending}
              onClick={handleCreateCategory}
            >
              {createCategory.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
