import {NextRequest, NextResponse} from 'next/server';
import '@/lib/db';
import {User} from '@/models/user';
import {generateToken} from '@/lib/jwt';
import bcrypt from 'bcryptjs';
import {loginSchema} from '@/validation/auth';
import dbConnect from '@/lib/db';

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const body = await req.json();
    const {email, password} = loginSchema.parse(body);

    // Find user by email
    const user = await User.findOne({email});
    if (!user) {
      return NextResponse.json({error: 'Invalid email or password'}, {status: 401});
    }

    // Check password
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({error: 'Invalid email or password'}, {status: 401});
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
    });

    return NextResponse.json(
      {
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            email: user.email,
          },
          token,
        },
      },
      {status: 200}
    );
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return NextResponse.json({error: 'Validation error', issues: err.issues}, {status: 400});
    }
    return NextResponse.json({error: 'Failed to login', details: err.message}, {status: 500});
  }
}
