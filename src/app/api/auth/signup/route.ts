import {NextRequest, NextResponse} from 'next/server';
import '@/lib/db';
import {User} from '@/models/user';
import {signupSchema} from '@/validation/auth';
import {generateToken} from '@/lib/jwt';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';

export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const body = await req.json();
    const {email, password} = signupSchema.parse(body);

    // Check if user already exists
    const existingUser = await User.findOne({email: email});
    if (existingUser) {
      return NextResponse.json({error: 'User with this email already exists'}, {status: 409});
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await User.create({
      email: email,
      password: hashedPassword,
    });

    return NextResponse.json(
      {
        message: 'User created successfully',
        data: {
          user: {
            id: user._id,
            email: user.email,
          },
        },
      },
      {status: 201}
    );
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return NextResponse.json({error: 'Validation error', issues: err.issues}, {status: 400});
    }
    return NextResponse.json({error: 'Failed to create user', details: err.message}, {status: 500});
  }
}
