import mongoose, {Schema, models} from 'mongoose';

export type TodoStatus = 'pending' | 'completed';

export interface ITodo {
  title: string;
  description?: string;
  status: TodoStatus;
  userId: string;
  createdAt: Date;
}

const TodoSchema = new Schema<ITodo>(
  {
    title: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 100,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  {versionKey: false}
);

export const Todo = models.Todo || mongoose.model<ITodo>('Todo', TodoSchema);