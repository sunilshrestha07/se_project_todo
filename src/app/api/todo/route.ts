// app/api/todos/route.ts
import {NextRequest, NextResponse} from 'next/server';
import '@/lib/db';
import {Todo} from '@/models/todo';
import {createTodoSchema} from '@/validation/todo';
import {authenticateUser, AuthenticatedRequest} from '@/middleware/auth';

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const authError = await authenticateUser(req);
    if (authError) return authError;

    const userId = (req as AuthenticatedRequest).user!.id;
    const todos = await Todo.find({userId}).sort({createdAt: -1}).lean();

    return NextResponse.json({data: todos}, {status: 200});
  } catch (err: any) {
    return NextResponse.json({error: 'Failed to fetch todos', details: err.message}, {status: 500});
  }
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const authError = await authenticateUser(req);
    if (authError) return authError;

    const userId = (req as AuthenticatedRequest).user!.id;

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
    if (err?.name === 'ZodError') {
      return NextResponse.json({error: 'Validation error', issues: err.issues}, {status: 400});
    }
    return NextResponse.json({error: 'Failed to create todo', details: err.message}, {status: 500});
  }
}
