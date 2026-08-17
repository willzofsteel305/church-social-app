import express from 'express';
import { body, validationResult } from 'express-validator';
import { login, register } from '../controllers/authController';

const router = express.Router();

const validate = (req: express.Request, res: express.Response, next: express.NextFunction): express.Response | void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post(
  '/register',
  [body('email').isEmail(), body('password').isLength({ min: 6 }), body('firstName').notEmpty(), body('lastName').notEmpty()],
  validate,
  register
);

router.post('/login', [body('email').isEmail(), body('password').notEmpty()], validate, login);

router.post('/logout', (_req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
});

export default router;
