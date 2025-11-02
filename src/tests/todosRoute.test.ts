import {NextRequest} from 'next/server';
import {GET as getTodos, POST as postTodo} from '@/app/api/todo/route';
import {GET as getTodoById, PUT as putTodo, DELETE as deleteTodo} from '@/app/api/todo/[id]/route';
import {Todo} from '@/models/todo';
import mongoose from 'mongoose';

// Mock everything at once
jest.mock('@/lib/db');
jest.mock('@/models/todo');
jest.mock('@/lib/jwt', () => ({
  verifyToken: jest.fn(() => ({userId: 'user123', email: 'test@example.com'})),
  extractTokenFromHeader: jest.fn((header: string | null) => header?.replace('Bearer ', '') || null),
}));

describe('Todos API - Successful CRUD Operations', () => {
  const userId = 'user123';
  const validId = new mongoose.Types.ObjectId().toString();
  const mockTodo = {_id: validId, title: 'Test Todo', userId, status: 'pending'};

  // create requests
  const createRequest = (method = 'GET', body?: any) =>
    new NextRequest('http://localhost/api/todo', {
      method,
      headers: {Authorization: 'Bearer valid-token', 'Content-Type': 'application/json'},
      body: body ? JSON.stringify(body) : undefined,
    });

  beforeEach(() => {
    jest.clearAllMocks();

    (Todo.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnValue({lean: jest.fn().mockResolvedValue([mockTodo])}),
    });
    (Todo.create as jest.Mock).mockResolvedValue(mockTodo);
    (Todo.findOneAndUpdate as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockTodo),
    });
    (Todo.findOneAndDelete as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockTodo),
    });
  });

  it('retrieves all todos for authenticated user', async () => {
    const res = await getTodos(createRequest());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual([mockTodo]);
  });

  it('creates a new todo successfully', async () => {
    const res = await postTodo(createRequest('POST', {title: 'New Todo'}));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(Todo.create).toHaveBeenCalledWith({userId, title: 'New Todo', description: undefined});
  });

  it('updates an existing todo successfully', async () => {
    const res = await putTodo(createRequest('PUT', {title: 'Updated Todo', status: 'completed'}), {
      params: Promise.resolve({id: validId}),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(Todo.findOneAndUpdate).toHaveBeenCalledWith(
      {_id: validId, userId},
      {title: 'Updated Todo', status: 'completed'},
      {new: true, runValidators: true}
    );
  });

  it('deletes a todo successfully', async () => {
    const res = await deleteTodo(createRequest('DELETE'), {
      params: Promise.resolve({id: validId}),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.message).toBe('Deleted successful');
  });
});
