import {z} from 'zod';

export const todoStatusEnum = z.enum(['pending', 'completed']);

export const createTodoSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  status: todoStatusEnum.optional(),
});

export const updateTodoSchema = z
  .object({
    title: z.string().min(3).max(100).optional(),
    description: z.string().max(500).optional(),
    status: todoStatusEnum.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
    path: [],
  });

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;