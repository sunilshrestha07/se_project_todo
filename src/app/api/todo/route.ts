// app/api/todos/route.ts
import {NextRequest, NextResponse} from 'next/server';
import '@/lib/db';
import {Todo} from '@/models/todo';
import {createTodoSchema} from '@/validation/todo';
import {verifyToken, extractTokenFromHeader} from '@/lib/jwt';
import dbConnect from '@/lib/db';

export async function GET(req: NextRequest) {
  await dbConnect();
  try {
    // Authenticate by token
    const authHeader = req.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json({error: 'Access denied. No token provided.'}, {status: 401});
    }

    const decoded = verifyToken(token);
    const userId = decoded.userId;

    const todos = await Todo.find({userId}).sort({createdAt: -1}).lean();

    return NextResponse.json({data: todos}, {status: 200});
  } catch (err: any) {
    if (err.message?.includes('token')) {
      return NextResponse.json({error: 'Invalid token.', details: err.message}, {status: 401});
    }
    return NextResponse.json({error: 'Failed to fetch todos', details: err.message}, {status: 500});
  }
}

export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    // Authenticate by token
    const authHeader = req.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json({error: 'Access denied. No token provided.'}, {status: 401});
    }

    const decoded = verifyToken(token);
    const userId = decoded.userId;

    // Parse and validate request body
    const body = await req.json();
    const {title, description} = createTodoSchema.parse(body);

    // Create new todo
    const todo = await Todo.create({
      userId,
      title,
      description,
    });

    return NextResponse.json({data: todo}, {status: 201});
  } catch (err: any) {
    if (err.message?.includes('token')) {
      return NextResponse.json({error: 'Invalid token.', details: err.message}, {status: 401});
    }
    if (err?.name === 'ZodError') {
      return NextResponse.json({error: 'Validation error', issues: err.issues}, {status: 400});
    }
    return NextResponse.json({error: 'Failed to create todo', details: err.message}, {status: 500});
  }
}
