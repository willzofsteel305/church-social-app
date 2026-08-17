import { Request, Response } from 'express';
import { query } from '../db';

export const getUserProfile = async (req: Request, res: Response): Promise<Response> => {
  const userId = Number(req.params.id);

  if (Number.isNaN(userId)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }

  try {
    const result = await query(
      `SELECT id, email, first_name, last_name, profile_image_url, bio, is_admin, created_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (!result.rowCount) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        name: `${user.first_name} ${user.last_name}`,
        profileImageUrl: user.profile_image_url,
        bio: user.bio,
        isAdmin: user.is_admin,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    return res.status(500).json({ message: 'Failed to fetch user profile' });
  }
};

export const updateUserProfile = async (req: Request, res: Response): Promise<Response> => {
  const userId = Number(req.params.id);
  const authenticatedUser = req.user?.userId;
  const { firstName, lastName, bio, profileImageUrl } = req.body;

  if (!authenticatedUser) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (Number.isNaN(userId)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }

  if (authenticatedUser !== userId) {
    return res.status(403).json({ message: 'Not allowed to update this profile' });
  }

  try {
    const result = await query(
      `UPDATE users
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           bio = COALESCE($3, bio),
           profile_image_url = COALESCE($4, profile_image_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, email, first_name, last_name, profile_image_url, bio, is_admin, updated_at`,
      [firstName ?? null, lastName ?? null, bio ?? null, profileImageUrl ?? null, userId]
    );

    if (!result.rowCount) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user: result.rows[0] });
  } catch (error) {
    console.error('Update user profile error:', error);
    return res.status(500).json({ message: 'Failed to update user profile' });
  }
};

export const getUserPosts = async (req: Request, res: Response): Promise<Response> => {
  const userId = Number(req.params.id);

  if (Number.isNaN(userId)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }

  try {
    const result = await query(
      `SELECT id, user_id, title, content, type, visibility, created_at
       FROM posts
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    return res.status(200).json({ posts: result.rows });
  } catch (error) {
    console.error('Get user posts error:', error);
    return res.status(500).json({ message: 'Failed to fetch user posts' });
  }
};

export const getUserEvents = async (req: Request, res: Response): Promise<Response> => {
  const userId = Number(req.params.id);

  if (Number.isNaN(userId)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }

  try {
    const result = await query(
      `SELECT e.id, e.title, e.description, e.event_date, e.location, e.organizer_id,
              er.status AS rsvp_status
       FROM event_rsvps er
       JOIN events e ON e.id = er.event_id
       WHERE er.user_id = $1
       ORDER BY e.event_date ASC`,
      [userId]
    );

    return res.status(200).json({
      events: result.rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        date: row.event_date,
        location: row.location,
        organizerId: row.organizer_id,
        rsvpStatus: row.rsvp_status,
      })),
    });
  } catch (error) {
    console.error('Get user events error:', error);
    return res.status(500).json({ message: 'Failed to fetch user events' });
  }
};
