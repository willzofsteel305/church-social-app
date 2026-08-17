import { Request, Response } from 'express';
import { query } from '../db';

export const getPosts = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const result = await query(
      `SELECT p.id, p.title, p.content, p.type, p.visibility, p.created_at,
              u.id AS user_id, u.first_name, u.last_name
       FROM posts p
       JOIN users u ON u.id = p.user_id
       ORDER BY p.created_at DESC`
    );

    return res.status(200).json({
      posts: result.rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        type: row.type,
        visibility: row.visibility,
        createdAt: row.created_at,
        user: {
          id: row.user_id,
          firstName: row.first_name,
          lastName: row.last_name,
          name: `${row.first_name} ${row.last_name}`,
        },
      })),
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return res.status(500).json({ message: 'Failed to fetch posts' });
  }
};

export const getPostById = async (req: Request, res: Response): Promise<Response> => {
  const postId = Number(req.params.id);

  if (Number.isNaN(postId)) {
    return res.status(400).json({ message: 'Invalid post id' });
  }

  try {
    const result = await query(
      `SELECT p.id, p.title, p.content, p.type, p.visibility, p.created_at,
              u.id AS user_id, u.first_name, u.last_name
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = $1`,
      [postId]
    );

    if (!result.rowCount) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const row = result.rows[0];
    return res.status(200).json({
      post: {
        id: row.id,
        title: row.title,
        content: row.content,
        type: row.type,
        visibility: row.visibility,
        createdAt: row.created_at,
        user: {
          id: row.user_id,
          firstName: row.first_name,
          lastName: row.last_name,
          name: `${row.first_name} ${row.last_name}`,
        },
      },
    });
  } catch (error) {
    console.error('Get post error:', error);
    return res.status(500).json({ message: 'Failed to fetch post' });
  }
};

export const createPost = async (req: Request, res: Response): Promise<Response> => {
  const userId = req.user?.userId;
  const { title, content, type, visibility } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!content) {
    return res.status(400).json({ message: 'Content is required' });
  }

  try {
    const result = await query(
      `INSERT INTO posts (user_id, title, content, type, visibility)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, title, content, type, visibility, created_at`,
      [userId, title || null, content, type || 'regular', visibility || 'public']
    );

    return res.status(201).json({ post: result.rows[0] });
  } catch (error) {
    console.error('Create post error:', error);
    return res.status(500).json({ message: 'Failed to create post' });
  }
};

export const updatePost = async (req: Request, res: Response): Promise<Response> => {
  const postId = Number(req.params.id);
  const userId = req.user?.userId;
  const { title, content, visibility } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (Number.isNaN(postId)) {
    return res.status(400).json({ message: 'Invalid post id' });
  }

  try {
    const ownership = await query('SELECT user_id FROM posts WHERE id = $1', [postId]);
    if (!ownership.rowCount) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (ownership.rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'Not allowed to edit this post' });
    }

    const result = await query(
      `UPDATE posts
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           visibility = COALESCE($3, visibility),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, user_id, title, content, visibility, updated_at`,
      [title ?? null, content ?? null, visibility ?? null, postId]
    );

    return res.status(200).json({ post: result.rows[0] });
  } catch (error) {
    console.error('Update post error:', error);
    return res.status(500).json({ message: 'Failed to update post' });
  }
};

export const deletePost = async (req: Request, res: Response): Promise<Response> => {
  const postId = Number(req.params.id);
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (Number.isNaN(postId)) {
    return res.status(400).json({ message: 'Invalid post id' });
  }

  try {
    const ownership = await query('SELECT user_id FROM posts WHERE id = $1', [postId]);
    if (!ownership.rowCount) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (ownership.rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'Not allowed to delete this post' });
    }

    await query('DELETE FROM posts WHERE id = $1', [postId]);
    return res.status(200).json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Delete post error:', error);
    return res.status(500).json({ message: 'Failed to delete post' });
  }
};

export const addComment = async (req: Request, res: Response): Promise<Response> => {
  const postId = Number(req.params.id);
  const userId = req.user?.userId;
  const { content } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (Number.isNaN(postId) || !content) {
    return res.status(400).json({ message: 'Valid post id and content are required' });
  }

  try {
    const result = await query(
      `INSERT INTO comments (post_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, post_id, user_id, content, created_at`,
      [postId, userId, content]
    );

    return res.status(201).json({ comment: result.rows[0] });
  } catch (error) {
    console.error('Add comment error:', error);
    return res.status(500).json({ message: 'Failed to add comment' });
  }
};

export const addReaction = async (req: Request, res: Response): Promise<Response> => {
  const postId = Number(req.params.id);
  const userId = req.user?.userId;
  const { reactionType } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (Number.isNaN(postId)) {
    return res.status(400).json({ message: 'Invalid post id' });
  }

  try {
    const result = await query(
      `INSERT INTO reactions (post_id, user_id, reaction_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (post_id, user_id, reaction_type) DO UPDATE
       SET reaction_type = EXCLUDED.reaction_type
       RETURNING id, post_id, user_id, reaction_type, created_at`,
      [postId, userId, reactionType || 'like']
    );

    return res.status(201).json({ reaction: result.rows[0] });
  } catch (error) {
    console.error('Add reaction error:', error);
    return res.status(500).json({ message: 'Failed to add reaction' });
  }
};
