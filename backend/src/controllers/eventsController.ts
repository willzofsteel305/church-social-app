import { Request, Response } from 'express';
import { query } from '../db';

export const getEvents = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const result = await query(
      `SELECT e.id, e.title, e.description, e.event_date, e.location, e.organizer_id, e.capacity, e.created_at,
              u.first_name, u.last_name
       FROM events e
       JOIN users u ON u.id = e.organizer_id
       ORDER BY e.event_date ASC`
    );

    return res.status(200).json({
      events: result.rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        date: row.event_date,
        location: row.location,
        organizerId: row.organizer_id,
        organizerName: `${row.first_name} ${row.last_name}`,
        capacity: row.capacity,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error('Get events error:', error);
    return res.status(500).json({ message: 'Failed to fetch events' });
  }
};

export const getEventById = async (req: Request, res: Response): Promise<Response> => {
  const eventId = Number(req.params.id);

  if (Number.isNaN(eventId)) {
    return res.status(400).json({ message: 'Invalid event id' });
  }

  try {
    const result = await query(
      `SELECT e.id, e.title, e.description, e.event_date, e.location, e.organizer_id, e.capacity, e.created_at,
              u.first_name, u.last_name
       FROM events e
       JOIN users u ON u.id = e.organizer_id
       WHERE e.id = $1`,
      [eventId]
    );

    if (!result.rowCount) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const row = result.rows[0];
    return res.status(200).json({
      event: {
        id: row.id,
        title: row.title,
        description: row.description,
        date: row.event_date,
        location: row.location,
        organizerId: row.organizer_id,
        organizerName: `${row.first_name} ${row.last_name}`,
        capacity: row.capacity,
        createdAt: row.created_at,
      },
    });
  } catch (error) {
    console.error('Get event error:', error);
    return res.status(500).json({ message: 'Failed to fetch event' });
  }
};

export const createEvent = async (req: Request, res: Response): Promise<Response> => {
  const organizerId = req.user?.userId;
  const { title, description, date, location, capacity } = req.body;

  if (!organizerId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!title || !date) {
    return res.status(400).json({ message: 'Title and date are required' });
  }

  try {
    const result = await query(
      `INSERT INTO events (title, description, event_date, location, organizer_id, capacity)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, title, description, event_date, location, organizer_id, capacity, created_at`,
      [title, description || null, date, location || null, organizerId, capacity || null]
    );

    return res.status(201).json({ event: result.rows[0] });
  } catch (error) {
    console.error('Create event error:', error);
    return res.status(500).json({ message: 'Failed to create event' });
  }
};

export const updateEvent = async (req: Request, res: Response): Promise<Response> => {
  const eventId = Number(req.params.id);
  const userId = req.user?.userId;
  const { title, description, date, location, capacity } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (Number.isNaN(eventId)) {
    return res.status(400).json({ message: 'Invalid event id' });
  }

  try {
    const ownership = await query('SELECT organizer_id FROM events WHERE id = $1', [eventId]);
    if (!ownership.rowCount) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (ownership.rows[0].organizer_id !== userId) {
      return res.status(403).json({ message: 'Not allowed to edit this event' });
    }

    const result = await query(
      `UPDATE events
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           event_date = COALESCE($3, event_date),
           location = COALESCE($4, location),
           capacity = COALESCE($5, capacity),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, title, description, event_date, location, organizer_id, capacity, updated_at`,
      [title ?? null, description ?? null, date ?? null, location ?? null, capacity ?? null, eventId]
    );

    return res.status(200).json({ event: result.rows[0] });
  } catch (error) {
    console.error('Update event error:', error);
    return res.status(500).json({ message: 'Failed to update event' });
  }
};

export const deleteEvent = async (req: Request, res: Response): Promise<Response> => {
  const eventId = Number(req.params.id);
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (Number.isNaN(eventId)) {
    return res.status(400).json({ message: 'Invalid event id' });
  }

  try {
    const ownership = await query('SELECT organizer_id FROM events WHERE id = $1', [eventId]);
    if (!ownership.rowCount) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (ownership.rows[0].organizer_id !== userId) {
      return res.status(403).json({ message: 'Not allowed to delete this event' });
    }

    await query('DELETE FROM events WHERE id = $1', [eventId]);
    return res.status(200).json({ message: 'Event deleted' });
  } catch (error) {
    console.error('Delete event error:', error);
    return res.status(500).json({ message: 'Failed to delete event' });
  }
};

export const rsvpToEvent = async (req: Request, res: Response): Promise<Response> => {
  const eventId = Number(req.params.id);
  const userId = req.user?.userId;
  const { status } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (Number.isNaN(eventId)) {
    return res.status(400).json({ message: 'Invalid event id' });
  }

  try {
    const result = await query(
      `INSERT INTO event_rsvps (event_id, user_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id, user_id)
       DO UPDATE SET status = EXCLUDED.status
       RETURNING id, event_id, user_id, status, created_at`,
      [eventId, userId, status || 'interested']
    );

    return res.status(201).json({ rsvp: result.rows[0] });
  } catch (error) {
    console.error('RSVP error:', error);
    return res.status(500).json({ message: 'Failed to RSVP to event' });
  }
};
