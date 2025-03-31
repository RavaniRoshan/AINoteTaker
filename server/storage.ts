import { 
  User, InsertUser, 
  Category, InsertCategory, 
  Note, InsertNote, 
  Task, InsertTask,
  SearchHistory, InsertSearchHistory,
  UserSettings,
  users, categories, notes, tasks, searchHistory
} from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq, and, desc } from "drizzle-orm";
import { neonConfig, Pool } from "@neondatabase/serverless";
import * as bcrypt from "bcryptjs";
import { db } from "./db";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserSettings(id: number, settings: UserSettings): Promise<User | undefined>;
  verifyPassword(username: string, password: string): Promise<User | undefined>;
  
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

  // Search history methods
  getSearchHistory(userId: number): Promise<SearchHistory[]>;
  addSearchHistory(searchHistory: InsertSearchHistory): Promise<SearchHistory>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private notes: Map<number, Note>;
  private tasks: Map<number, Task>;
  private searchHistories: Map<number, SearchHistory>;
  
  private userIdCounter: number;
  private categoryIdCounter: number;
  private noteIdCounter: number;
  private taskIdCounter: number;
  private searchHistoryIdCounter: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.notes = new Map();
    this.tasks = new Map();
    this.searchHistories = new Map();
    
    this.userIdCounter = 1;
    this.categoryIdCounter = 1;
    this.noteIdCounter = 1;
    this.taskIdCounter = 1;
    this.searchHistoryIdCounter = 1;

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

    // Create a default user (with fixed ID for demo)
    const demoUser: User = {
      id: 1,
      username: "demo",
      password: "password",
      name: "Demo User",
      email: "demo@example.com",
      profilePicture: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      preferences: "{}"
    };
    this.users.set(demoUser.id, demoUser);

    // Initialize with default categories
    const personalCategory = {
      id: 1,
      name: "Personal",
      color: "blue-500",
      icon: "folder",
      userId: demoUser.id
    };
    
    const workCategory = {
      id: 2,
      name: "Work",
      color: "green-500",
      icon: "folder",
      userId: demoUser.id
    };
    
    const projectsCategory = {
      id: 3,
      name: "Projects",
      color: "yellow-500",
      icon: "folder",
      userId: demoUser.id
    };
    
    this.categories.set(personalCategory.id, personalCategory);
    this.categories.set(workCategory.id, workCategory);
    this.categories.set(projectsCategory.id, projectsCategory);

    // Initialize with a default note
    const now = new Date();
    const defaultNote = {
      id: 1,
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
      userId: demoUser.id,
      isFavorite: false,
      isArchived: false,
      categoryId: personalCategory.id,
      createdAt: now,
      updatedAt: now
    };
    this.notes.set(defaultNote.id, defaultNote);

    // Add some default tasks to the note
    const task1 = {
      id: 1,
      description: "Try out the editor formatting tools",
      completed: false,
      noteId: defaultNote.id,
      dueDate: null
    };
    
    const task2 = {
      id: 2,
      description: "Create a new note with the + button",
      completed: false,
      noteId: defaultNote.id,
      dueDate: null
    };
    
    const task3 = {
      id: 3,
      description: "Ask for AI suggestions",
      completed: false,
      noteId: defaultNote.id,
      dueDate: null
    };
    
    this.tasks.set(task1.id, task1);
    this.tasks.set(task2.id, task2);
    this.tasks.set(task3.id, task3);
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
    const now = new Date();
    const newUser: User = { 
      ...user, 
      id,
      name: user.name || "",
      email: user.email || null,
      profilePicture: user.profilePicture || "",
      createdAt: now,
      updatedAt: now,
      preferences: "{}"
    };
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
      updatedAt: now,
      isFavorite: note.isFavorite || false,
      isArchived: note.isArchived || false,
      categoryId: note.categoryId || null
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
    const newTask: Task = { 
      ...task, 
      id,
      completed: task.completed || false,
      dueDate: task.dueDate || null
    };
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

  // New methods for auth
  async updateUserSettings(id: number, settings: UserSettings): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    // Create a copy of the settings object to avoid modifying the original
    const updatedSettings: Partial<User> = {};
    
    // Copy allowed fields
    if (settings.name !== undefined) updatedSettings.name = settings.name || "";
    if (settings.email !== undefined) updatedSettings.email = settings.email;
    if (settings.profilePicture !== undefined) updatedSettings.profilePicture = settings.profilePicture;
    
    // Handle preferences specifically - convert to string if it's an object
    if (settings.preferences !== undefined) {
      if (settings.preferences === null) {
        updatedSettings.preferences = "{}";
      } else if (typeof settings.preferences === 'object') {
        updatedSettings.preferences = JSON.stringify(settings.preferences);
      } else if (typeof settings.preferences === 'string') {
        updatedSettings.preferences = settings.preferences;
      } else {
        updatedSettings.preferences = "{}";
      }
    }
    
    const updatedUser = { 
      ...user, 
      ...updatedSettings,
      updatedAt: new Date() 
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async verifyPassword(username: string, password: string): Promise<User | undefined> {
    const user = await this.getUserByUsername(username);
    if (!user) return undefined;
    
    // In memory storage we just compare directly
    // In real implementation we would use bcrypt.compare
    if (user.password === password) {
      return user;
    }
    
    return undefined;
  }

  // Search history methods
  async getSearchHistory(userId: number): Promise<SearchHistory[]> {
    return Array.from(this.searchHistories.values())
      .filter(history => history.userId === userId)
      .sort((a, b) => {
        // Sort by date descending (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async addSearchHistory(searchHistory: InsertSearchHistory): Promise<SearchHistory> {
    const id = this.searchHistoryIdCounter++;
    const now = new Date();
    const newSearchHistory: SearchHistory = {
      ...searchHistory,
      id,
      createdAt: now,
      result: searchHistory.result || null,
      isAiQuery: searchHistory.isAiQuery || false
    };
    this.searchHistories.set(id, newSearchHistory);
    return newSearchHistory;
  }
}

// PostgreSQL Storage Implementation
export class PostgresStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    // Use the existing drizzle connection from db.ts
    this.db = db;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const results = await this.db.select().from(users).where(eq(users.id, id));
    return results[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await this.db.select().from(users).where(eq(users.username, username));
    return results[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    // Hash the password
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    const results = await this.db.insert(users).values({
      ...user,
      name: user.name || "",
      profilePicture: user.profilePicture || "",
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
      preferences: "{}"
    }).returning();
    
    return results[0];
  }

  async updateUserSettings(id: number, settings: UserSettings): Promise<User | undefined> {
    // Start with just the updatedAt field
    const updateData: Partial<User> = {
      updatedAt: new Date()
    };
    
    // Only include fields that are defined
    if (settings.name !== undefined) updateData.name = settings.name || "";
    if (settings.email !== undefined) updateData.email = settings.email;
    if (settings.profilePicture !== undefined) updateData.profilePicture = settings.profilePicture;
    
    // Handle preferences specifically
    if (settings.preferences !== undefined) {
      if (settings.preferences === null) {
        updateData.preferences = "{}";
      } else if (typeof settings.preferences === 'object') {
        updateData.preferences = JSON.stringify(settings.preferences);
      } else if (typeof settings.preferences === 'string') {
        updateData.preferences = settings.preferences;
      } else {
        updateData.preferences = "{}";
      }
    }
    
    const results = await this.db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
      
    return results[0];
  }

  async verifyPassword(username: string, password: string): Promise<User | undefined> {
    const user = await this.getUserByUsername(username);
    if (!user) return undefined;
    
    const isValid = await bcrypt.compare(password, user.password);
    if (isValid) {
      return user;
    }
    
    return undefined;
  }

  // Category methods
  async getCategories(userId: number): Promise<Category[]> {
    return this.db.select().from(categories).where(eq(categories.userId, userId));
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const results = await this.db.select().from(categories).where(eq(categories.id, id));
    return results[0];
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const results = await this.db.insert(categories).values(category).returning();
    return results[0];
  }

  async updateCategory(id: number, categoryUpdate: Partial<InsertCategory>): Promise<Category | undefined> {
    const results = await this.db.update(categories)
      .set(categoryUpdate)
      .where(eq(categories.id, id))
      .returning();
      
    return results[0];
  }

  async deleteCategory(id: number): Promise<boolean> {
    // First check if category exists
    const category = await this.getCategory(id);
    if (!category) return false;
    
    await this.db.delete(categories).where(eq(categories.id, id));
    return true;
  }

  // Note methods
  async getNotes(userId: number): Promise<Note[]> {
    return this.db.select().from(notes)
      .where(and(
        eq(notes.userId, userId),
        eq(notes.isArchived, false)
      ));
  }

  async getNote(id: number): Promise<Note | undefined> {
    const results = await this.db.select().from(notes).where(eq(notes.id, id));
    return results[0];
  }

  async createNote(note: InsertNote): Promise<Note> {
    const now = new Date();
    const results = await this.db.insert(notes).values({
      ...note,
      createdAt: now,
      updatedAt: now
    }).returning();
    
    return results[0];
  }

  async updateNote(id: number, noteUpdate: Partial<InsertNote>): Promise<Note | undefined> {
    const results = await this.db.update(notes)
      .set({
        ...noteUpdate,
        updatedAt: new Date()
      })
      .where(eq(notes.id, id))
      .returning();
      
    return results[0];
  }

  async deleteNote(id: number): Promise<boolean> {
    // First check if note exists
    const note = await this.getNote(id);
    if (!note) return false;
    
    await this.db.delete(notes).where(eq(notes.id, id));
    return true;
  }

  async getFavoriteNotes(userId: number): Promise<Note[]> {
    return this.db.select().from(notes)
      .where(and(
        eq(notes.userId, userId),
        eq(notes.isFavorite, true),
        eq(notes.isArchived, false)
      ));
  }

  async getArchivedNotes(userId: number): Promise<Note[]> {
    return this.db.select().from(notes)
      .where(and(
        eq(notes.userId, userId),
        eq(notes.isArchived, true)
      ));
  }

  async getNotesByCategory(categoryId: number): Promise<Note[]> {
    return this.db.select().from(notes)
      .where(and(
        eq(notes.categoryId, categoryId),
        eq(notes.isArchived, false)
      ));
  }

  // Task methods
  async getTasks(noteId: number): Promise<Task[]> {
    return this.db.select().from(tasks).where(eq(tasks.noteId, noteId));
  }

  async getTask(id: number): Promise<Task | undefined> {
    const results = await this.db.select().from(tasks).where(eq(tasks.id, id));
    return results[0];
  }

  async createTask(task: InsertTask): Promise<Task> {
    const results = await this.db.insert(tasks).values(task).returning();
    return results[0];
  }

  async updateTask(id: number, taskUpdate: Partial<InsertTask>): Promise<Task | undefined> {
    const results = await this.db.update(tasks)
      .set(taskUpdate)
      .where(eq(tasks.id, id))
      .returning();
      
    return results[0];
  }

  async deleteTask(id: number): Promise<boolean> {
    // First check if task exists
    const task = await this.getTask(id);
    if (!task) return false;
    
    await this.db.delete(tasks).where(eq(tasks.id, id));
    return true;
  }

  // Search History methods
  async getSearchHistory(userId: number): Promise<SearchHistory[]> {
    return this.db.select().from(searchHistory)
      .where(eq(searchHistory.userId, userId))
      .orderBy(desc(searchHistory.createdAt));
  }

  async addSearchHistory(history: InsertSearchHistory): Promise<SearchHistory> {
    const results = await this.db.insert(searchHistory).values({
      ...history,
      createdAt: new Date()
    }).returning();
    
    return results[0];
  }
}

// Use PostgreSQL storage if DATABASE_URL is provided, otherwise use in-memory storage
const usePostgres = process.env.DATABASE_URL ? true : false;
export const storage = usePostgres ? new PostgresStorage() : new MemStorage();
