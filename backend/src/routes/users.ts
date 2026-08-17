import express from 'express';
import {
  getUserEvents,
  getUserPosts,
  getUserProfile,
  updateUserProfile,
} from '../controllers/usersController';
import { authenticateToken } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimit';

const router = express.Router();

router.get('/:id', getUserProfile);
router.put('/:id', authenticateToken, authRateLimiter, updateUserProfile);
router.get('/:id/posts', getUserPosts);
router.get('/:id/events', getUserEvents);

export default router;
