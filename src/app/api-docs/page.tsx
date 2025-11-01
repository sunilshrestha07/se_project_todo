"use client";

import React, { useEffect, useRef } from "react";
import "swagger-ui-dist/swagger-ui.css";

const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Todo API ",
    version: "2.0.0",
  },
  servers: [
    {
      url: "/api",
      description: "API Server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          'JWT token obtained from login endpoint. Include "Bearer " prefix in Authorization header.',
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string", description: "User ID" },
          email: {
            type: "string",
            format: "email",
            description: "User email address",
          },
        },
        required: ["id", "email"],
      },
      Todo: {
        type: "object",
        properties: {
          _id: { type: "string", description: "Todo ID" },
          title: {
            type: "string",
            description: "Todo title",
            minLength: 3,
            maxLength: 100,
          },
          description: {
            type: "string",
            description: "Todo description (optional)",
            maxLength: 500,
          },
          status: {
            type: "string",
            enum: ["pending", "completed"],
            description: "Todo status",
            default: "pending",
          },
          userId: { type: "string", description: "User ID who owns this todo" },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Creation timestamp",
          },
        },
        required: ["_id", "title", "status", "userId", "createdAt"],
      },
      AuthResponse: {
        type: "object",
        properties: {
          message: { type: "string", description: "Response message" },
          data: {
            type: "object",
            properties: {
              user: { $ref: "#/components/schemas/User" },
              token: {
                type: "string",
                description: "JWT token for authentication",
              },
            },
            required: ["user", "token"],
          },
        },
        required: ["message", "data"],
      },
      TodoResponse: {
        type: "object",
        properties: {
          data: { $ref: "#/components/schemas/Todo" },
        },
        required: ["data"],
      },
      TodosResponse: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/Todo" },
            description: "Array of todos",
          },
        },
        required: ["data"],
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string", description: "Error message" },
          details: { type: "string", description: "Additional error details" },
          issues: {
            type: "array",
            description: "Validation issues (for validation errors)",
          },
        },
        required: ["error"],
      },
      SignupRequest: {
        type: "object",
        properties: {
          email: {
            type: "string",
            format: "email",
            description: "User email address",
          },
          password: {
            type: "string",
            minLength: 6,
            description: "User password (minimum 6 characters)",
          },
        },
        required: ["email", "password"],
      },
      LoginRequest: {
        type: "object",
        properties: {
          email: {
            type: "string",
            format: "email",
            description: "User email address",
          },
          password: { type: "string", description: "User password" },
        },
        required: ["email", "password"],
      },
      CreateTodoRequest: {
        type: "object",
        properties: {
          title: {
            type: "string",
            minLength: 3,
            maxLength: 100,
            description: "Todo title",
          },
          description: {
            type: "string",
            maxLength: 500,
            description: "Todo description (optional)",
          },
          status: {
            type: "string",
            enum: ["pending", "completed"],
            description: "Todo status (optional, defaults to pending)",
          },
        },
        required: ["title"],
      },
      UpdateTodoRequest: {
        type: "object",
        properties: {
          title: {
            type: "string",
            minLength: 3,
            maxLength: 100,
            description: "Todo title",
          },
          description: {
            type: "string",
            maxLength: 500,
            description: "Todo description",
          },
          status: {
            type: "string",
            enum: ["pending", "completed"],
            description: "Todo status",
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    "/auth/signup": {
      post: {
        tags: ["Authentication"],
        summary: "Register a new user",
        description:
          "Create a new user account with email and password. Returns user information and JWT token.",
        operationId: "signup",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SignupRequest" },
              examples: {
                example1: {
                  summary: "Example signup request",
                  value: {
                    email: "user@example.com",
                    password: "password123",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "User created successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
                examples: {
                  success: {
                    summary: "Successful signup",
                    value: {
                      message: "User created successfully",
                      data: {
                        user: {
                          id: "507f1f77bcf86cd799439011",
                          email: "user@example.com",
                        },
                        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Validation error - Invalid input data",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                examples: {
                  validationError: {
                    summary: "Validation error",
                    value: {
                      error: "Validation error",
                      issues: [
                        {
                          code: "invalid_type",
                          expected: "string",
                          received: "undefined",
                          path: ["email"],
                          message: "Required",
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
          "409": {
            description: "Conflict - User already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                examples: {
                  userExists: {
                    summary: "User already exists",
                    value: {
                      error: "User with this email already exists",
                    },
                  },
                },
              },
            },
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Login user",
        description:
          "Authenticate user with email and password. Returns user information and JWT token.",
        operationId: "login",
        security: [], // No authentication required for login
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
              examples: {
                example1: {
                  summary: "Example login request",
                  value: {
                    email: "user@example.com",
                    password: "password123",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
                examples: {
                  success: {
                    summary: "Successful login",
                    value: {
                      message: "Login successful",
                      data: {
                        user: {
                          id: "507f1f77bcf86cd799439011",
                          email: "user@example.com",
                        },
                        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Validation error - Invalid input data",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Unauthorized - Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                examples: {
                  invalidCredentials: {
                    summary: "Invalid credentials",
                    value: {
                      error: "Invalid email or password",
                    },
                  },
                },
              },
            },
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/todo": {
      get: {
        tags: ["Todos"],
        summary: "Get all todos",
        description:
          "Retrieve all todos belonging to the authenticated user. Todos are filtered by user ID.",
        operationId: "getTodos",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "List of user todos retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TodosResponse" },
                examples: {
                  success: {
                    summary: "Successful response",
                    value: {
                      data: [
                        {
                          _id: "507f1f77bcf86cd799439011",
                          title: "Complete project",
                          description: "Finish the todo API project",
                          status: "pending",
                          userId: "507f1f77bcf86cd799439012",
                          createdAt: "2023-12-01T10:00:00.000Z",
                        },
                        {
                          _id: "507f1f77bcf86cd799439013",
                          title: "Review code",
                          status: "completed",
                          userId: "507f1f77bcf86cd799439012",
                          createdAt: "2023-11-30T15:30:00.000Z",
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized - Invalid or missing JWT token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                examples: {
                  unauthorized: {
                    summary: "Unauthorized access",
                    value: {
                      error: "Access denied. No token provided.",
                    },
                  },
                },
              },
            },
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Todos"],
        summary: "Create a new todo",
        description:
          "Create a new todo for the authenticated user. The todo will be automatically associated with the authenticated user.",
        operationId: "createTodo",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateTodoRequest" },
              examples: {
                example1: {
                  summary: "Create todo with title only",
                  value: {
                    title: "Buy groceries",
                  },
                },
                example2: {
                  summary: "Create todo with all fields",
                  value: {
                    title: "Complete project",
                    description: "Finish the todo API implementation",
                    status: "pending",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Todo created successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TodoResponse" },
                examples: {
                  success: {
                    summary: "Successful creation",
                    value: {
                      data: {
                        _id: "507f1f77bcf86cd799439011",
                        title: "Buy groceries",
                        description: null,
                        status: "pending",
                        userId: "507f1f77bcf86cd799439012",
                        createdAt: "2023-12-01T10:00:00.000Z",
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Validation error - Invalid input data",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                examples: {
                  validationError: {
                    summary: "Validation error",
                    value: {
                      error: "Validation error",
                      issues: [
                        {
                          code: "too_small",
                          minimum: 3,
                          type: "string",
                          inclusive: true,
                          exact: false,
                          message:
                            "String must contain at least 3 character(s)",
                          path: ["title"],
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized - Invalid or missing JWT token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/todo/{id}": {
      get: {
        tags: ["Todos"],
        summary: "Get a specific todo",
        description:
          "Retrieve a specific todo by ID belonging to the authenticated user",
        operationId: "getTodoById",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "objectid" },
            description: "Todo ID (MongoDB ObjectId)",
            example: "507f1f77bcf86cd799439011",
          },
        ],
        responses: {
          "200": {
            description: "Todo found successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TodoResponse" },
                examples: {
                  success: {
                    summary: "Successful response",
                    value: {
                      data: {
                        _id: "507f1f77bcf86cd799439011",
                        title: "Complete project",
                        description: "Finish the todo API implementation",
                        status: "pending",
                        userId: "507f1f77bcf86cd799439012",
                        createdAt: "2023-12-01T10:00:00.000Z",
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Bad request - Invalid todo ID format",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                examples: {
                  invalidId: {
                    summary: "Invalid ID format",
                    value: {
                      error: "Invalid ID",
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized - Invalid or missing JWT token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description:
              "Not found - Todo does not exist or does not belong to user",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                examples: {
                  notFound: {
                    summary: "Todo not found",
                    value: {
                      error: "Not found",
                    },
                  },
                },
              },
            },
          },
        },
      },
      put: {
        tags: ["Todos"],
        summary: "Update a specific todo",
        description:
          "Update a specific todo by ID belonging to the authenticated user",
        operationId: "updateTodo",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "objectid" },
            description: "Todo ID (MongoDB ObjectId)",
            example: "507f1f77bcf86cd799439011",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateTodoRequest" },
              examples: {
                example1: {
                  summary: "Update todo status",
                  value: {
                    status: "completed",
                  },
                },
                example2: {
                  summary: "Update multiple fields",
                  value: {
                    title: "Updated project task",
                    description: "Updated description",
                    status: "pending",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Todo updated successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TodoResponse" },
                examples: {
                  success: {
                    summary: "Successful update",
                    value: {
                      data: {
                        _id: "507f1f77bcf86cd799439011",
                        title: "Updated project task",
                        description: "Updated description",
                        status: "completed",
                        userId: "507f1f77bcf86cd799439012",
                        createdAt: "2023-12-01T10:00:00.000Z",
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Bad request - Invalid input data or todo ID format",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Unauthorized - Invalid or missing JWT token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description:
              "Not found - Todo does not exist or does not belong to user",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Todos"],
        summary: "Delete a specific todo",
        description:
          "Delete a specific todo by ID belonging to the authenticated user",
        operationId: "deleteTodo",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "objectid" },
            description: "Todo ID (MongoDB ObjectId)",
            example: "507f1f77bcf86cd799439011",
          },
        ],
        responses: {
          "200": {
            description: "Todo deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", description: "Success message" },
                  },
                  required: ["message"],
                },
                examples: {
                  success: {
                    summary: "Successful deletion",
                    value: {
                      message: "Deleted successful",
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Bad request - Invalid todo ID format",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                examples: {
                  invalidId: {
                    summary: "Invalid ID format",
                    value: {
                      error: "Invalid ID",
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized - Invalid or missing JWT token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description:
              "Not found - Todo does not exist or does not belong to user",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                examples: {
                  notFound: {
                    summary: "Todo not found",
                    value: {
                      error: "Not found",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

export default function ApiDocsPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let ui: any;
    let isCancelled = false;

    const mountSwagger = async () => {
      try {
        const mod = await import("swagger-ui-dist/swagger-ui-es-bundle.js");
        const SwaggerUI = mod.default || mod.SwaggerUI || mod;
        if (!isCancelled && containerRef.current) {
          ui = SwaggerUI({
            domNode: containerRef.current,
            spec: openApiSpec,
            deepLinking: true,
          });
        }
      } catch (error) {
        console.error("Failed to load Swagger UI:", error);
      }
    };

    mountSwagger();
    return () => {
      isCancelled = true;
      if (ui && typeof ui.destroy === "function") ui.destroy();
    };
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Todo API Documentation
          </h1>
        </div>
        <div ref={containerRef} />
      </div>
    </main>
  );
}
