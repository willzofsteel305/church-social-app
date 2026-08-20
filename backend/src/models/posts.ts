import { QueryResult } from 'pg';
import { query } from '../db';

export type Post = {
  id: number;
  userId: number;
  title?: string | null;
  content: string;
  type: string;
  visibility: string;
  createdAt: string;
  updatedAt: string;
};

export async function getPostsByUser(userId: number): Promise<Post[]> {
  const text = `
    SELECT id, user_id AS "userId", title, content, type, visibility, created_at AS "createdAt", updated_at AS "updatedAt"
    FROM posts
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 100;
  `;
  const res: QueryResult<Post> = await query<Post>(text, [userId]);
  return res.rows;
}
