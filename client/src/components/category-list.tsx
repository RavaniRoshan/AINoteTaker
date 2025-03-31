import { Link, useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { type Category } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';

export function CategoryList() {
  const [location] = useLocation();
  
  const { data: categories, isLoading } = useQuery({ 
    queryKey: ['/api/categories']
  });
  
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
  
  if (isLoading) {
    return (
      <div className="space-y-2 mt-1">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }
  
  if (!categories || categories.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-2">
        No categories found
      </div>
    );
  }
  
  return (
    <div className="mt-1 space-y-1">
      {categories.map((category: Category) => (
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
      ))}
    </div>
  );
}
