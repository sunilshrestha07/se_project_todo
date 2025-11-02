import {NextRequest, NextResponse} from 'next/server';
import '@/lib/db';
import {Todo} from '@/models/todo';
import {updateTodoSchema} from '@/validation/todo';
import {authenticateUser, AuthenticatedRequest} from '@/middleware/auth';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';

export async function GET(req: NextRequest, context: {params: Promise<{id: string}>}) {
  await dbConnect();
  try {
    // Authenticate user
    const authError = await authenticateUser(req);
    if (authError) return authError;

    const userId = (req as AuthenticatedRequest).user!.id;
    const params = await context.params;
    const id = params.id;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({error: 'Invalid ID'}, {status: 400});
    }
    const todo = await Todo.findOne({_id: id, userId}).lean();
    if (!todo) return NextResponse.json({error: 'Not found'}, {status: 404});
    return NextResponse.json({data: todo}, {status: 200});
  } catch (err: any) {
    return NextResponse.json({error: 'Failed to fetch todo', details: err.message}, {status: 500});
  }
}

export async function PUT(req: NextRequest, context: {params: Promise<{id: string}>}) {
  await dbConnect();
  try {
    // Authenticate user
    const authError = await authenticateUser(req);
    if (authError) return authError;

    const userId = (req as AuthenticatedRequest).user!.id;
    const params = await context.params;
    const id = params.id;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({error: 'Invalid ID'}, {status: 400});
    }
    const body = await req.json();
    const parsed = updateTodoSchema.parse(body);
    const updated = await Todo.findOneAndUpdate({_id: id, userId}, parsed, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) return NextResponse.json({error: 'Not found'}, {status: 404});
    return NextResponse.json({data: updated}, {status: 200});
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return NextResponse.json({error: 'Validation error', issues: err.issues}, {status: 400});
    }
    return NextResponse.json({error: 'Failed to update todo', details: err.message}, {status: 500});
  }
}

export async function DELETE(req: NextRequest, {params}: {params: Promise<{id: string}>}) {
  try {
    // Authenticate user
    const authError = await authenticateUser(req);
    if (authError) return authError;

    const userId = (req as AuthenticatedRequest).user!.id;
    const resolvedParams = await params;
    const {id} = resolvedParams;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({error: 'Invalid ID'}, {status: 400});
    }
    const deleted = await Todo.findOneAndDelete({_id: id, userId}).lean();
    if (!deleted) return NextResponse.json({error: 'Not found'}, {status: 404});
    return NextResponse.json({message: 'Deleted successful'}, {status: 200});
  } catch (err: any) {
    return NextResponse.json({error: 'Failed to delete todo', details: err.message}, {status: 500});
  }
}
