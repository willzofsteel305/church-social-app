import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'church_app',
  max: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || '5000', 10),
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

export const query = async <T extends QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<QueryResult<T>> => {
  try {
    return await pool.query<T>(text, params);
  } catch (error) {
    console.error('Database query failed', { text, error });
    throw error;
  }
};

export const withClient = async <T>(fn: (client: PoolClient) => Promise<T>): Promise<T> => {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
};

export const closePool = async (): Promise<void> => {
  await pool.end();
};

export const db = {
  users: {
    async create(email: string, passwordHash: string, firstName: string, lastName: string): Promise<number> {
      const result = await query<{ id: number }>(
        `INSERT INTO users (email, password_hash, first_name, last_name)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [email, passwordHash, firstName, lastName]
      );

      return result.rows[0].id;
    },

    async findByEmail(email: string): Promise<{
      id: number;
      email: string;
      passwordHash: string;
      firstName: string;
      lastName: string;
    } | null> {
      const result = await query<{
        id: number;
        email: string;
        passwordHash: string;
        firstName: string;
        lastName: string;
      }>(
        `SELECT id, email, password_hash AS "passwordHash", first_name AS "firstName", last_name AS "lastName"
         FROM users
         WHERE email = $1`,
        [email]
      );

      return result.rows[0] ?? null;
    },

    async findById(id: number): Promise<{
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      bio: string | null;
      profileImageUrl: string | null;
      createdAt: string;
    } | null> {
      const result = await query<{
        id: number;
        email: string;
        firstName: string;
        lastName: string;
        bio: string | null;
        profileImageUrl: string | null;
        createdAt: string;
      }>(
        `SELECT id, email, first_name AS "firstName", last_name AS "lastName", bio,
                profile_image_url AS "profileImageUrl", created_at AS "createdAt"
         FROM users
         WHERE id = $1`,
        [id]
      );

      return result.rows[0] ?? null;
    },

    async updateProfile(id: number, bio?: string, profileImageUrl?: string): Promise<boolean> {
      const result = await query(
        `UPDATE users
         SET bio = COALESCE($2, bio),
             profile_image_url = COALESCE($3, profile_image_url),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id, bio, profileImageUrl]
      );

      return result.rowCount > 0;
    },

    async getPosts(userId: number): Promise<Array<Record<string, unknown>>> {
      const result = await query<Record<string, unknown>>(
        `SELECT id, user_id AS "userId", title, content, type, visibility,
                created_at AS "createdAt", updated_at AS "updatedAt"
         FROM posts
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      );

      return result.rows;
    },

    async getEvents(userId: number): Promise<Array<Record<string, unknown>>> {
      const result = await query<Record<string, unknown>>(
        `SELECT e.id, e.title, e.description, e.event_date AS "eventDate", e.location,
                e.capacity, r.status
         FROM event_rsvps r
         JOIN events e ON e.id = r.event_id
         WHERE r.user_id = $1
         ORDER BY e.event_date ASC`,
        [userId]
      );

      return result.rows;
    },
  },

  posts: {
    async getAll(): Promise<Array<Record<string, unknown>>> {
      const result = await query<Record<string, unknown>>(
        `SELECT p.id, p.user_id AS "userId", p.title, p.content, p.type, p.visibility,
                p.created_at AS "createdAt", p.updated_at AS "updatedAt",
                COALESCE(COUNT(DISTINCT r.id), 0)::int AS reactions,
                COALESCE(COUNT(DISTINCT c.id), 0)::int AS comments
         FROM posts p
         LEFT JOIN reactions r ON r.post_id = p.id
         LEFT JOIN comments c ON c.post_id = p.id
         GROUP BY p.id
         ORDER BY p.created_at DESC`
      );

      return result.rows;
    },

    async getById(id: number): Promise<Record<string, unknown> | null> {
      const result = await query<Record<string, unknown>>(
        `SELECT id, user_id AS "userId", title, content, type, visibility,
                created_at AS "createdAt", updated_at AS "updatedAt"
         FROM posts
         WHERE id = $1`,
        [id]
      );

      return result.rows[0] ?? null;
    },

    async create(userId: number, title: string | undefined, content: string, type?: string, visibility?: string): Promise<number> {
      const result = await query<{ id: number }>(
        `INSERT INTO posts (user_id, title, content, type, visibility)
         VALUES ($1, $2, $3, COALESCE($4, 'regular'), COALESCE($5, 'public'))
         RETURNING id`,
        [userId, title ?? null, content, type, visibility]
      );

      return result.rows[0].id;
    },

    async update(id: number, title?: string, content?: string): Promise<boolean> {
      const result = await query(
        `UPDATE posts
         SET title = COALESCE($2, title),
             content = COALESCE($3, content),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id, title, content]
      );

      return result.rowCount > 0;
    },

    async delete(id: number): Promise<boolean> {
      const result = await query('DELETE FROM posts WHERE id = $1', [id]);
      return result.rowCount > 0;
    },
  },

  comments: {
    async create(postId: number, userId: number, content: string): Promise<number> {
      const result = await query<{ id: number }>(
        `INSERT INTO comments (post_id, user_id, content)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [postId, userId, content]
      );

      return result.rows[0].id;
    },
  },

  reactions: {
    async add(postId: number, userId: number, reactionType?: string): Promise<number> {
      const result = await query<{ id: number }>(
        `INSERT INTO reactions (post_id, user_id, reaction_type)
         VALUES ($1, $2, COALESCE($3, 'like'))
         ON CONFLICT (post_id, user_id, reaction_type)
         DO UPDATE SET created_at = CURRENT_TIMESTAMP
         RETURNING id`,
        [postId, userId, reactionType]
      );

      return result.rows[0].id;
    },
  },

  events: {
    async getAll(): Promise<Array<Record<string, unknown>>> {
      const result = await query<Record<string, unknown>>(
        `SELECT e.id, e.title, e.description, e.event_date AS "eventDate", e.location,
                e.capacity, e.organizer_id AS "organizerId", e.created_at AS "createdAt",
                COALESCE(COUNT(r.id), 0)::int AS "rsvpCount"
         FROM events e
         LEFT JOIN event_rsvps r ON r.event_id = e.id
         GROUP BY e.id
         ORDER BY e.event_date ASC`
      );

      return result.rows;
    },

    async getById(id: number): Promise<Record<string, unknown> | null> {
      const result = await query<Record<string, unknown>>(
        `SELECT id, title, description, event_date AS "eventDate", location,
                organizer_id AS "organizerId", capacity, created_at AS "createdAt"
         FROM events
         WHERE id = $1`,
        [id]
      );

      return result.rows[0] ?? null;
    },

    async create(
      title: string,
      description: string | undefined,
      eventDate: string,
      location: string | undefined,
      organizerId: number,
      capacity?: number
    ): Promise<number> {
      const result = await query<{ id: number }>(
        `INSERT INTO events (title, description, event_date, location, organizer_id, capacity)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [title, description ?? null, eventDate, location ?? null, organizerId, capacity ?? null]
      );

      return result.rows[0].id;
    },

    async update(id: number, title?: string, description?: string, eventDate?: string, location?: string, capacity?: number): Promise<boolean> {
      const result = await query(
        `UPDATE events
         SET title = COALESCE($2, title),
             description = COALESCE($3, description),
             event_date = COALESCE($4, event_date),
             location = COALESCE($5, location),
             capacity = COALESCE($6, capacity),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id, title, description, eventDate, location, capacity]
      );

      return result.rowCount > 0;
    },

    async delete(id: number): Promise<boolean> {
      const result = await query('DELETE FROM events WHERE id = $1', [id]);
      return result.rowCount > 0;
    },
  },

  rsvps: {
    async upsert(eventId: number, userId: number, status?: string): Promise<number> {
      const result = await query<{ id: number }>(
        `INSERT INTO event_rsvps (event_id, user_id, status)
         VALUES ($1, $2, COALESCE($3, 'interested'))
         ON CONFLICT (event_id, user_id)
         DO UPDATE SET status = EXCLUDED.status, created_at = CURRENT_TIMESTAMP
         RETURNING id`,
        [eventId, userId, status]
      );

      return result.rows[0].id;
    },
  },

  donations: {
    async create(userId: number | null, amount: number, fundName?: string): Promise<number> {
      const result = await query<{ id: number }>(
        `INSERT INTO donations (user_id, amount, fund_name)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [userId, amount, fundName ?? null]
      );

      return result.rows[0].id;
    },
  },

  volunteers: {
    async create(userId: number, role?: string): Promise<number> {
      const result = await query<{ id: number }>(
        `INSERT INTO volunteers (user_id, role)
         VALUES ($1, $2)
         RETURNING id`,
        [userId, role ?? null]
      );

      return result.rows[0].id;
    },

    async listByUser(userId: number): Promise<Array<Record<string, unknown>>> {
      const result = await query<Record<string, unknown>>(
        `SELECT id, user_id AS "userId", role, status, created_at AS "createdAt", updated_at AS "updatedAt"
         FROM volunteers
         WHERE user_id = $1`,
        [userId]
      );

      return result.rows;
    },
  },
};

export default pool;
