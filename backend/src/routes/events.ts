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
import { authRateLimiter } from '../middleware/rateLimit';

const router = express.Router();

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', authenticateToken, authRateLimiter, createEvent);
router.put('/:id', authenticateToken, authRateLimiter, updateEvent);
router.delete('/:id', authenticateToken, authRateLimiter, deleteEvent);
router.post('/:id/rsvp', authenticateToken, authRateLimiter, rsvpToEvent);

export default router;
