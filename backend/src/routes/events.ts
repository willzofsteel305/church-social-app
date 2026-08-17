import express from 'express';
import {
  createEvent,
  deleteEvent,
  getEventById,
  getEvents,
  rsvpToEvent,
  updateEvent,
} from '../controllers/eventsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', authenticateToken, createEvent);
router.put('/:id', authenticateToken, updateEvent);
router.delete('/:id', authenticateToken, deleteEvent);
router.post('/:id/rsvp', authenticateToken, rsvpToEvent);

export default router;
