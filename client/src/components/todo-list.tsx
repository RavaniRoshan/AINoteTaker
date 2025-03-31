import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import { type Task } from '@shared/schema';

interface TodoListProps {
  noteId: number;
  tasks: Task[];
}

export function TodoList({ noteId, tasks }: TodoListProps) {
  const [newTask, setNewTask] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  
  const createTask = useMutation({
    mutationFn: async (description: string) => {
      const res = await apiRequest('POST', `/api/notes/${noteId}/tasks`, {
        description,
        completed: false
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notes/${noteId}/tasks`] });
      setNewTask('');
      setAddingTask(false);
    }
  });
  
  const updateTask = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      const res = await apiRequest('PUT', `/api/tasks/${id}`, { completed });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notes/${noteId}/tasks`] });
    }
  });
  
  const deleteTask = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/tasks/${id}`);
      return res.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notes/${noteId}/tasks`] });
    }
  });
  
  const handleCheckboxChange = (id: number, completed: boolean) => {
    updateTask.mutate({ id, completed: !completed });
  };
  
  const handleAddTask = () => {
    if (newTask.trim()) {
      createTask.mutate(newTask);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  };
  
  return (
    <div className="space-y-2 mt-6">
      <h3 className="text-lg font-medium text-gray-900">Tasks</h3>
      
      <div className="space-y-2">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task.id} className="flex items-start group">
              <Checkbox
                id={`task-${task.id}`}
                checked={task.completed}
                onCheckedChange={() => handleCheckboxChange(task.id, task.completed)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div className="ml-3">
                <label
                  htmlFor={`task-${task.id}`}
                  className={`text-sm ${
                    task.completed ? 'text-gray-400 line-through' : 'text-gray-700'
                  }`}
                >
                  {task.description}
                </label>
                {task.dueDate && (
                  <p className="text-xs text-gray-500">
                    Due {format(new Date(task.dueDate), 'PPP')}
                  </p>
                )}
              </div>
              <button
                onClick={() => deleteTask.mutate(task.id)}
                className="ml-auto opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  <line x1="10" x2="10" y1="11" y2="17"></line>
                  <line x1="14" x2="14" y1="11" y2="17"></line>
                </svg>
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">No tasks yet. Add your first task below.</p>
        )}
        
        {addingTask ? (
          <div className="flex items-center mt-2">
            <Input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a new task..."
              className="text-sm"
              autoFocus
            />
            <button
              onClick={handleAddTask}
              disabled={!newTask.trim() || createTask.isPending}
              className="ml-2 text-primary hover:text-primary/80 disabled:text-gray-400"
            >
              Add
            </button>
            <button
              onClick={() => setAddingTask(false)}
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div
            onClick={() => setAddingTask(true)}
            className="flex items-center mt-2 text-gray-500 hover:text-primary cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus">
              <path d="M5 12h14"></path>
              <path d="M12 5v14"></path>
            </svg>
            <span className="ml-1 text-sm">Add task</span>
          </div>
        )}
      </div>
    </div>
  );
}
