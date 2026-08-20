import express from 'express';
import { requireAuth } from '../middleware/auth';
import { findUserById } from '../models/users';

const router = express.Router();

// Get public profile by id
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' });
  const user = await findUserById(id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.status(200).json({ user });
});

// Get current authenticated user
router.get('/me', requireAuth, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  const user = await findUserById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.status(200).json({ user });
});

// Update user profile
router.put('/:id', (req, res) => {
  // TODO: Update user profile
  res.status(200).json({ message: 'Profile updated' });
});

// Get user's posts
router.get('/:id/posts', (req, res) => {
  // TODO: Fetch user's posts
  res.status(200).json({ posts: [] });
});

// Get user's events
router.get('/:id/events', (req, res) => {
  // TODO: Fetch user's events
  res.status(200).json({ events: [] });
});

export default router;
