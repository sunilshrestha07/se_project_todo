import {NextRequest} from 'next/server';
import {GET as getTodos, POST as postTodo} from '@/app/api/todo/route';
import {GET as getTodoById, PUT as putTodo, DELETE as deleteTodo} from '@/app/api/todo/[id]/route';
import {Todo} from '@/models/todo';
import {User} from '@/models/user';
import mongoose from 'mongoose';

// Mock DB and models
jest.mock('@/lib/db');
jest.mock('@/models/todo', () => ({
  Todo: {
    find: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn(),
    create: jest.fn(),
    findById: jest.fn().mockReturnThis(),
    findByIdAndUpdate: jest.fn().mockReturnThis(),
    findByIdAndDelete: jest.fn().mockReturnThis(),
    findOneAndUpdate: jest.fn().mockReturnThis(),
    findOneAndDelete: jest.fn().mockReturnThis(),
  },
}));

jest.mock('@/models/user', () => ({
  User: {
    findById: jest.fn(),
  },
}));

// Mock authentication middleware
jest.mock('@/middleware/auth', () => ({
  authenticateUser: jest.fn(),
}));

describe('Todos API Routes with Authentication', () => {
  afterEach(() => jest.clearAllMocks());

  const validId = new mongoose.Types.ObjectId().toString();
  const invalidId = '123';
  const userId = 'user123';
  const mockUser = {id: userId, email: 'test@example.com'};

  // Mock authenticated request
  const createAuthenticatedRequest = (method: string = 'GET', body?: string) => {
    const req = new NextRequest('http://localhost/api/todo', {
      method,
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body,
    });
    (req as any).user = mockUser;
    return req;
  };

  beforeEach(() => {
    // Mock successful authentication by default
    const {authenticateUser} = require('@/middleware/auth');
    (authenticateUser as jest.Mock).mockResolvedValue(null);
  });

  // ===== GET /api/todos =====
  describe('GET /api/todos', () => {
    it('returns user todos successfully', async () => {
      const mockTodos = [
        {_id: 'todo1', title: 'Test Todo 1', userId, status: 'pending'},
        {_id: 'todo2', title: 'Test Todo 2', userId, status: 'completed'},
      ];
      (Todo.find().sort().lean as jest.Mock).mockResolvedValue(mockTodos);

      const req = createAuthenticatedRequest();
      const res = await getTodos(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toEqual(mockTodos);
      expect(Todo.find).toHaveBeenCalledWith({userId});
    });

    it('returns 401 when not authenticated', async () => {
      const {authenticateUser} = require('@/middleware/auth');
      (authenticateUser as jest.Mock).mockResolvedValue(
        new Response(JSON.stringify({error: 'Access denied. No token provided.'}), {
          status: 401,
          headers: {'Content-Type': 'application/json'},
        })
      );

      const req = new NextRequest('http://localhost/api/todo');
      const res = await getTodos(req);

      expect(res.status).toBe(401);
    });

    it('handles database errors', async () => {
      (Todo.find().sort().lean as jest.Mock).mockRejectedValue(new Error('DB error'));

      const req = createAuthenticatedRequest();
      const res = await getTodos(req);
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.error).toBe('Failed to fetch todos');
      expect(json.details).toBe('DB error');
    });
  });

  // ===== POST /api/todos =====
  describe('POST /api/todos', () => {
    it('creates a todo successfully for authenticated user', async () => {
      const mockTodo = {_id: 'todo1', title: 'New Todo', userId, status: 'pending'};
      (Todo.create as jest.Mock).mockResolvedValue(mockTodo);

      const req = createAuthenticatedRequest('POST', JSON.stringify({title: 'New Todo'}));

      const res = await postTodo(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.data).toEqual(mockTodo);
      expect(Todo.create).toHaveBeenCalledWith({
        userId,
        title: 'New Todo',
        description: undefined,
      });
    });

    it('returns 401 when not authenticated', async () => {
      const {authenticateUser} = require('@/middleware/auth');
      (authenticateUser as jest.Mock).mockResolvedValue(
        new Response(JSON.stringify({error: 'Access denied. No token provided.'}), {
          status: 401,
          headers: {'Content-Type': 'application/json'},
        })
      );

      const req = new NextRequest('http://localhost/api/todo', {
        method: 'POST',
        body: JSON.stringify({title: 'New Todo'}),
      });

      const res = await postTodo(req);
      expect(res.status).toBe(401);
    });

    it('returns validation error', async () => {
      const req = createAuthenticatedRequest('POST', JSON.stringify({})); // invalid

      const res = await postTodo(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe('Validation error');
      expect(json.issues).toBeDefined();
    });

    it('handles creation failure', async () => {
      (Todo.create as jest.Mock).mockRejectedValue(new Error('DB insert error'));

      const req = createAuthenticatedRequest('POST', JSON.stringify({title: 'Fail Todo'}));

      const res = await postTodo(req);
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.error).toBe('Failed to create todo');
      expect(json.details).toBe('DB insert error');
    });
  });

  // ===== GET /api/todos/[id] =====
  describe('GET /api/todos/[id]', () => {
    it('returns user todo successfully', async () => {
      const mockTodo = {_id: validId, title: 'Test Todo', userId, status: 'pending'};
      (Todo.findOne().lean as jest.Mock).mockResolvedValue(mockTodo);

      const req = createAuthenticatedRequest();
      const res = await getTodoById(req, {params: Promise.resolve({id: validId})});
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toEqual(mockTodo);
      expect(Todo.findOne).toHaveBeenCalledWith({_id: validId, userId});
    });

    it('returns 401 when not authenticated', async () => {
      const {authenticateUser} = require('@/middleware/auth');
      (authenticateUser as jest.Mock).mockResolvedValue(
        new Response(JSON.stringify({error: 'Access denied. No token provided.'}), {
          status: 401,
          headers: {'Content-Type': 'application/json'},
        })
      );

      const req = new NextRequest('http://localhost/api/todo/123');
      const res = await getTodoById(req, {params: Promise.resolve({id: validId})});

      expect(res.status).toBe(401);
    });

    it('returns 404 if todo not found or not owned by user', async () => {
      (Todo.findOne().lean as jest.Mock).mockResolvedValue(null);

      const req = createAuthenticatedRequest();
      const res = await getTodoById(req, {params: Promise.resolve({id: validId})});
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.error).toBe('Not found');
    });

    it('returns 400 for invalid ID', async () => {
      const req = createAuthenticatedRequest();
      const res = await getTodoById(req, {params: Promise.resolve({id: invalidId})});
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe('Invalid ID');
    });
  });

  // ===== PUT /api/todos/[id] =====
  describe('PUT /api/todos/[id]', () => {
    it('updates user todo successfully', async () => {
      const updatedTodo = {_id: validId, title: 'Updated Todo', userId, status: 'completed'};
      (Todo.findOneAndUpdate().lean as jest.Mock).mockResolvedValue(updatedTodo);

      const req = createAuthenticatedRequest('PUT', JSON.stringify({title: 'Updated Todo', status: 'completed'}));

      const res = await putTodo(req, {params: Promise.resolve({id: validId})});
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toEqual(updatedTodo);
      expect(Todo.findOneAndUpdate).toHaveBeenCalledWith(
        {_id: validId, userId},
        {title: 'Updated Todo', status: 'completed'},
        {new: true, runValidators: true}
      );
    });

    it('returns 401 when not authenticated', async () => {
      const {authenticateUser} = require('@/middleware/auth');
      (authenticateUser as jest.Mock).mockResolvedValue(
        new Response(JSON.stringify({error: 'Access denied. No token provided.'}), {
          status: 401,
          headers: {'Content-Type': 'application/json'},
        })
      );

      const req = new NextRequest('http://localhost/api/todo/123', {
        method: 'PUT',
        body: JSON.stringify({title: 'Updated Todo'}),
      });

      const res = await putTodo(req, {params: Promise.resolve({id: validId})});
      expect(res.status).toBe(401);
    });

    it('returns validation error', async () => {
      const req = createAuthenticatedRequest('PUT', JSON.stringify({})); // invalid

      const res = await putTodo(req, {params: Promise.resolve({id: validId})});
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe('Validation error');
    });

    it('returns 404 if todo not found or not owned by user', async () => {
      (Todo.findOneAndUpdate().lean as jest.Mock).mockResolvedValue(null);

      const req = createAuthenticatedRequest('PUT', JSON.stringify({title: 'Updated Todo'}));

      const res = await putTodo(req, {params: Promise.resolve({id: validId})});
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.error).toBe('Not found');
    });
  });

  // ===== DELETE /api/todos/[id] =====
  describe('DELETE /api/todos/[id]', () => {
    it('deletes user todo successfully', async () => {
      const deletedTodo = {_id: validId, title: 'Deleted Todo', userId};
      (Todo.findOneAndDelete().lean as jest.Mock).mockResolvedValue(deletedTodo);

      const req = createAuthenticatedRequest();
      const res = await deleteTodo(req, {params: Promise.resolve({id: validId})});
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.message).toBe('Deleted successful');
      expect(Todo.findOneAndDelete).toHaveBeenCalledWith({_id: validId, userId});
    });

    it('returns 401 when not authenticated', async () => {
      const {authenticateUser} = require('@/middleware/auth');
      (authenticateUser as jest.Mock).mockResolvedValue(
        new Response(JSON.stringify({error: 'Access denied. No token provided.'}), {
          status: 401,
          headers: {'Content-Type': 'application/json'},
        })
      );

      const req = new NextRequest('http://localhost/api/todo/123');
      const res = await deleteTodo(req, {params: Promise.resolve({id: validId})});

      expect(res.status).toBe(401);
    });

    it('returns 404 if todo not found or not owned by user', async () => {
      (Todo.findOneAndDelete().lean as jest.Mock).mockResolvedValue(null);

      const req = createAuthenticatedRequest();
      const res = await deleteTodo(req, {params: Promise.resolve({id: validId})});
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.error).toBe('Not found');
    });

    it('returns 400 for invalid ID', async () => {
      const req = createAuthenticatedRequest();
      const res = await deleteTodo(req, {params: Promise.resolve({id: invalidId})});
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe('Invalid ID');
    });
  });

  // ===== User-specific todo filtering tests =====
  describe('User-specific todo filtering', () => {
    it('only returns todos belonging to authenticated user', async () => {
      const userTodos = [
        {_id: 'todo1', title: 'User Todo 1', userId, status: 'pending'},
        {_id: 'todo2', title: 'User Todo 2', userId, status: 'completed'},
      ];
      (Todo.find().sort().lean as jest.Mock).mockResolvedValue(userTodos);

      const req = createAuthenticatedRequest();
      const res = await getTodos(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toEqual(userTodos);
      expect(Todo.find).toHaveBeenCalledWith({userId});
    });

    it('prevents access to other users todos', async () => {
      (Todo.findOne().lean as jest.Mock).mockResolvedValue(null); // Not found because userId doesn't match

      const req = createAuthenticatedRequest();
      const res = await getTodoById(req, {params: Promise.resolve({id: validId})});
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.error).toBe('Not found');
    });
  });
});