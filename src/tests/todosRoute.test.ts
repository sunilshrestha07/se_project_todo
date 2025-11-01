import { NextRequest } from "next/server";
import { GET as getTodos, POST as postTodo } from "@/app/api/todo/route";
import {
  GET as getTodoById,
  PUT as putTodo,
  DELETE as deleteTodo,
} from "@/app/api/todo/[id]/route";
import { Todo } from "@/models/todo";
import mongoose from "mongoose";

// Mock DB and models
jest.mock("@/lib/db");
jest.mock("@/models/todo", () => ({
  Todo: {
    find: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn().mockReturnThis(),
    findOneAndDelete: jest.fn().mockReturnThis(),
  },
}));

// Mock authentication middleware
jest.mock("@/middleware/auth", () => ({
  authenticateUser: jest.fn(),
}));

describe("Todos API - Successful CRUD Operations", () => {
  afterEach(() => jest.clearAllMocks());

  const userId = "user123";
  const validId = new mongoose.Types.ObjectId().toString();
  const mockUser = { id: userId, email: "test@example.com" };

  // Create a fake authenticated NextRequest
  const createAuthenticatedRequest = (
    method: string = "GET",
    body?: string
  ) => {
    const req = new NextRequest("http://localhost/api/todo", {
      method,
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json",
      },
      body,
    });
    (req as any).user = mockUser;
    return req;
  };

  beforeEach(() => {
    const { authenticateUser } = require("@/middleware/auth");
    (authenticateUser as jest.Mock).mockResolvedValue(null);
  });

  // ✅ GET /api/todo
  it("retrieves all todos for authenticated user", async () => {
    const mockTodos = [
      { _id: "todo1", title: "Todo 1", userId, status: "pending" },
      { _id: "todo2", title: "Todo 2", userId, status: "completed" },
    ];
    (Todo.find().sort().lean as jest.Mock).mockResolvedValue(mockTodos);

    const req = createAuthenticatedRequest();
    const res = await getTodos(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual(mockTodos);
    expect(Todo.find).toHaveBeenCalledWith({ userId });
  });

  // ✅ POST /api/todo
  it("creates a new todo successfully", async () => {
    const mockTodo = {
      _id: "todo1",
      title: "New Todo",
      userId,
      status: "pending",
    };
    (Todo.create as jest.Mock).mockResolvedValue(mockTodo);

    const req = createAuthenticatedRequest(
      "POST",
      JSON.stringify({ title: "New Todo" })
    );

    const res = await postTodo(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data).toEqual(mockTodo);
    expect(Todo.create).toHaveBeenCalledWith({
      userId,
      title: "New Todo",
      description: undefined,
    });
  });

  // ✅ PUT /api/todo/[id]
  it("updates an existing todo successfully", async () => {
    const updatedTodo = {
      _id: validId,
      title: "Updated Todo",
      userId,
      status: "completed",
    };
    (Todo.findOneAndUpdate().lean as jest.Mock).mockResolvedValue(updatedTodo);

    const req = createAuthenticatedRequest(
      "PUT",
      JSON.stringify({ title: "Updated Todo", status: "completed" })
    );

    const res = await putTodo(req, {
      params: Promise.resolve({ id: validId }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual(updatedTodo);
    expect(Todo.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: validId, userId },
      { title: "Updated Todo", status: "completed" },
      { new: true, runValidators: true }
    );
  });

  // ✅ DELETE /api/todo/[id]
  it("deletes a todo successfully", async () => {
    const deletedTodo = { _id: validId, title: "Deleted Todo", userId };
    (Todo.findOneAndDelete().lean as jest.Mock).mockResolvedValue(deletedTodo);

    const req = createAuthenticatedRequest();
    const res = await deleteTodo(req, {
      params: Promise.resolve({ id: validId }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.message).toBe("Deleted successful");
    expect(Todo.findOneAndDelete).toHaveBeenCalledWith({
      _id: validId,
      userId,
    });
  });
});
