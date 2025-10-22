// src/routes/usersRoutes.js
import express from 'express';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';
import { listUsers, getUser, createUser, updateUser, deleteUser, setActive } from '../controllers/usersController.js';

const router = express.Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/', listUsers);
router.post('/', createUser);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.patch('/:id/active', setActive);

export default router;
