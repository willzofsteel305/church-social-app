import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, findUserRowByEmail, findUserByEmail } from '../models/users';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-prod';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS ? Number(process.env.BCRYPT_SALT_ROUNDS) : 10;

function makeToken(userId: number) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export async function register(req: Request, res: Response) {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const created = await createUser({
      email,
      passwordHash,
      firstName,
      lastName,
    });

    const token = makeToken(created.id);
    return res.status(201).json({ user: created, token });
  } catch (err: any) {
    console.error('register error', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing email or password' });

    const row = await findUserRowByEmail(email);
    if (!row) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, row.passwordHash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = makeToken(row.id);
    // Return public user object (omit passwordHash)
    const user = {
      id: row.id,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      profileImageUrl: row.profileImageUrl,
      bio: row.bio,
      isAdmin: row.isAdmin,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };

    return res.status(200).json({ user, token });
  } catch (err: any) {
    console.error('login error', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

export async function logout(_req: Request, res: Response) {
  // Stateless JWT: client should just delete token. Optionally implement token blacklist.
  return res.status(200).json({ message: 'Logged out' });
}
