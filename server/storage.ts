import { 
  User, InsertUser, 
  Category, InsertCategory, 
  Note, InsertNote, 
  Task, InsertTask 
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Category methods
  getCategories(userId: number): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Note methods
  getNotes(userId: number): Promise<Note[]>;
  getNote(id: number): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: number, note: Partial<InsertNote>): Promise<Note | undefined>;
  deleteNote(id: number): Promise<boolean>;
  getFavoriteNotes(userId: number): Promise<Note[]>;
  getArchivedNotes(userId: number): Promise<Note[]>;
  getNotesByCategory(categoryId: number): Promise<Note[]>;
  
  // Task methods
  getTasks(noteId: number): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private notes: Map<number, Note>;
  private tasks: Map<number, Task>;
  
  private userIdCounter: number;
  private categoryIdCounter: number;
  private noteIdCounter: number;
  private taskIdCounter: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.notes = new Map();
    this.tasks = new Map();
    
    this.userIdCounter = 1;
    this.categoryIdCounter = 1;
    this.noteIdCounter = 1;
    this.taskIdCounter = 1;

    // Initialize with default categories
    this.createCategory({
      name: "Personal",
      color: "blue-500",
      icon: "folder",
      userId: 1
    });
    this.createCategory({
      name: "Work",
      color: "green-500",
      icon: "folder",
      userId: 1
    });
    this.createCategory({
      name: "Projects",
      color: "yellow-500",
      icon: "folder",
      userId: 1
    });

    // Initialize with a default note
    const defaultNote = this.createNote({
      title: "Welcome to NoteGenius",
      content: JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Welcome to NoteGenius! This is a Notion-like application where you can take notes, create to-do lists, and get AI-powered suggestions.' }
            ]
          },
          {
            type: 'heading',
            attrs: { level: 3 },
            content: [
              { type: 'text', text: 'Tasks for today' }
            ]
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Here are some things you can try:' }
            ]
          }
        ]
      }),
      userId: 1,
      isFavorite: false,
      isArchived: false,
      categoryId: 1
    });

    // Add some default tasks to the note
    this.createTask({
      description: "Try out the editor formatting tools",
      completed: false,
      noteId: defaultNote.id
    });
    
    this.createTask({
      description: "Create a new note with the + button",
      completed: false,
      noteId: defaultNote.id
    });
    
    this.createTask({
      description: "Ask for AI suggestions",
      completed: false,
      noteId: defaultNote.id
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  // Category methods
  async getCategories(userId: number): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(
      category => category.userId === userId
    );
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  async updateCategory(id: number, categoryUpdate: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    
    const updatedCategory = { ...category, ...categoryUpdate };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Note methods
  async getNotes(userId: number): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(
      note => note.userId === userId && !note.isArchived
    );
  }

  async getNote(id: number): Promise<Note | undefined> {
    return this.notes.get(id);
  }

  async createNote(note: InsertNote): Promise<Note> {
    const id = this.noteIdCounter++;
    const now = new Date();
    const newNote: Note = { 
      ...note, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.notes.set(id, newNote);
    return newNote;
  }

  async updateNote(id: number, noteUpdate: Partial<InsertNote>): Promise<Note | undefined> {
    const note = this.notes.get(id);
    if (!note) return undefined;
    
    const updatedNote = { 
      ...note, 
      ...noteUpdate,
      updatedAt: new Date()
    };
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  async deleteNote(id: number): Promise<boolean> {
    return this.notes.delete(id);
  }

  async getFavoriteNotes(userId: number): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(
      note => note.userId === userId && note.isFavorite && !note.isArchived
    );
  }

  async getArchivedNotes(userId: number): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(
      note => note.userId === userId && note.isArchived
    );
  }

  async getNotesByCategory(categoryId: number): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(
      note => note.categoryId === categoryId && !note.isArchived
    );
  }

  // Task methods
  async getTasks(noteId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      task => task.noteId === noteId
    );
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(task: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const newTask: Task = { ...task, id };
    this.tasks.set(id, newTask);
    return newTask;
  }

  async updateTask(id: number, taskUpdate: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...taskUpdate };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }
}

export const storage = new MemStorage();
