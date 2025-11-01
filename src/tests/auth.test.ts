import { NextRequest } from "next/server";
import { POST as signup } from "@/app/api/auth/signup/route";
import { POST as login } from "@/app/api/auth/login/route";
import { User } from "@/models/user";

// Mock DB and dependencies
jest.mock("@/lib/db");
jest.mock("@/models/user", () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));
jest.mock("@/lib/jwt", () => ({
  generateToken: jest.fn(() => "test-token"),
}));

describe("Authentication API Routes", () => {
  afterEach(() => jest.clearAllMocks());

  // ===== ✅ POST /api/auth/signup (successful) =====
  it("creates a new user successfully", async () => {
    const mockUser = {
      _id: "user123",
      email: "test@example.com",
      toObject: jest.fn().mockReturnValue({
        _id: "user123",
        email: "test@example.com",
      }),
    };

    (User.findOne as jest.Mock).mockResolvedValue(null);
    (User.create as jest.Mock).mockResolvedValue(mockUser);

    const req = new NextRequest("http://localhost/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });

    const res = await signup(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.message).toBe("User created successfully");
    expect(json.data.user.email).toBe("test@example.com");
  });

  // ===== ✅ POST /api/auth/login (successful) =====
  it("logs in user successfully", async () => {
    const bcrypt = require("bcryptjs");
    const mockUser = {
      _id: "user123",
      email: "test@example.com",
      password: bcrypt.hashSync("password123", 10),
    };

    (User.findOne as jest.Mock).mockResolvedValue(mockUser);

    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });

    const res = await login(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.message).toBe("Login successful");
    expect(json.data.user.email).toBe("test@example.com");
    expect(json.data.token).toBeDefined();
  });
});
