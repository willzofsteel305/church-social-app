import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db';

const signToken = (userId: number, email: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT secret not configured');
  }

  return jwt.sign({ userId, email }, secret, {
    expiresIn: (process.env.JWT_EXPIRY || '7d') as jwt.SignOptions['expiresIn'],
  });
};

export const register = async (req: Request, res: Response): Promise<Response> => {
  const { email, password, firstName, lastName } = req.body;

  try {
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rowCount) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, first_name, last_name, created_at`,
      [email, passwordHash, firstName, lastName]
    );

    const user = result.rows[0];
    const token = signToken(user.id, user.email);

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        name: `${user.first_name} ${user.last_name}`,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Failed to register user' });
  }
};

export const login = async (req: Request, res: Response): Promise<Response> => {
  const { email, password } = req.body;

  try {
    const result = await query(
      `SELECT id, email, password_hash, first_name, last_name
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (!result.rowCount) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken(user.id, user.email);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        name: `${user.first_name} ${user.last_name}`,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Failed to log in' });
  }
};
