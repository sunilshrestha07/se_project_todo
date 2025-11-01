import {NextRequest, NextResponse} from 'next/server';
import {verifyToken, extractTokenFromHeader} from '@/lib/jwt';
import {User} from '@/models/user';
import '@/lib/db';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
  };
}

export const authenticateUser = async (req: NextRequest): Promise<NextResponse | null> => {
  try {
    const authHeader = req.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json({error: 'Access denied. No token provided.'}, {status: 401});
    }

    const decoded = verifyToken(token);

    // it exclude the user password from finding in this query
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return NextResponse.json({error: 'Invalid token. User not found.'}, {status: 401});
    }

    (req as AuthenticatedRequest).user = {
      id: user._id.toString(),
      email: user.email,
    };

    return null;
  } catch (error: any) {
    return NextResponse.json({error: 'Invalid token.', details: error.message}, {status: 401});
  }
};
