const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['lawyer', 'client'], { message: "Role must be 'lawyer' or 'client'" })
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const createCaseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  clientId: z.string().length(24, 'Invalid client ID format')
});

const updateCaseStatusSchema = z.object({
  status: z.enum(['Open', 'Active', 'Closed'], { message: "Status must be 'Open', 'Active', or 'Closed'" })
});

const deadlineSchema = z.object({
  title: z.string().min(2, 'Deadline title must be at least 2 characters'),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid due date' })
});

module.exports = {
  registerSchema,
  loginSchema,
  createCaseSchema,
  updateCaseStatusSchema,
  deadlineSchema
};
