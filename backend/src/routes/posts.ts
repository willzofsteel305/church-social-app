import express from 'express';
import {
  addComment,
  addReaction,
  createPost,
  deletePost,
  getPostById,
  getPosts,
  updatePost,
} from '../controllers/postsController';
import { authenticateToken } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimit';

const router = express.Router();

router.get('/', getPosts);
router.get('/:id', getPostById);
router.post('/', authenticateToken, authRateLimiter, createPost);
router.put('/:id', authenticateToken, authRateLimiter, updatePost);
router.delete('/:id', authenticateToken, authRateLimiter, deletePost);
router.post('/:id/comments', authenticateToken, authRateLimiter, addComment);
router.post('/:id/reactions', authenticateToken, authRateLimiter, addReaction);

export default router;
