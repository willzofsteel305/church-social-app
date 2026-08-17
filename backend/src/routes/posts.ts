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

const router = express.Router();

router.get('/', getPosts);
router.get('/:id', getPostById);
router.post('/', authenticateToken, createPost);
router.put('/:id', authenticateToken, updatePost);
router.delete('/:id', authenticateToken, deletePost);
router.post('/:id/comments', authenticateToken, addComment);
router.post('/:id/reactions', authenticateToken, addReaction);

export default router;
