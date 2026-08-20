import { QueryResult } from 'pg';
import { query } from '../db';

export type NewUser = {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string | null;
  bio?: string | null;
  isAdmin?: boolean;
};

export type User = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string | null;
  bio?: string | null;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Create a new user. Returns the inserted user (without password hash).
 */
export async function createUser(u: NewUser): Promise<User> {
  const text = `
    INSERT INTO users (email, password_hash, first_name, last_name, profile_image_url, bio, is_admin)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, email, first_name AS "firstName", last_name AS "lastName", profile_image_url AS "profileImageUrl", bio, is_admin AS "isAdmin", created_at AS "createdAt", updated_at AS "updatedAt";
  `;
  const params = [u.email, u.passwordHash, u.firstName, u.lastName, u.profileImageUrl || null, u.bio || null, u.isAdmin || false];
  const res: QueryResult<User> = await query<User>(text, params);
  return res.rows[0];
}

/**
 * Find a user by email. Returns the full row including password_hash when requested by caller.
 * Note: this function returns only the public fields by default. Use findUserRowByEmail when you need password_hash.
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const text = `
    SELECT id, email, first_name AS "firstName", last_name AS "lastName", profile_image_url AS "profileImageUrl", bio, is_admin AS "isAdmin", created_at AS "createdAt", updated_at AS "updatedAt"
    FROM users
    WHERE email = $1
    LIMIT 1;
  `;
  const res = await query<User>(text, [email]);
  return res.rows[0] || null;
}

/**
 * Find a user by email and include the password_hash field. Use this for authentication checks.
 */
export async function findUserRowByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
  const text = `
    SELECT id, email, password_hash AS "passwordHash", first_name AS "firstName", last_name AS "lastName", profile_image_url AS "profileImageUrl", bio, is_admin AS "isAdmin", created_at AS "createdAt", updated_at AS "updatedAt"
    FROM users
    WHERE email = $1
    LIMIT 1;
  `;
  const res = await query<any>(text, [email]);
  if (!res.rows[0]) return null;
  return res.rows[0];
}

export async function findUserById(id: number): Promise<User | null> {
  const text = `
    SELECT id, email, first_name AS "firstName", last_name AS "lastName", profile_image_url AS "profileImageUrl", bio, is_admin AS "isAdmin", created_at AS "createdAt", updated_at AS "updatedAt"
    FROM users
    WHERE id = $1
    LIMIT 1;
  `;
  const res = await query<User>(text, [id]);
  return res.rows[0] || null;
}
