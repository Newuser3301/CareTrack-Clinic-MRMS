const express = require('express');
const { body } = require('express-validator');
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

const userValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').optional({ checkFalsy: true }).isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(['admin', 'clinician', 'receptionist']).withMessage('Invalid role')
];

router.use(protect, authorize('admin'));

router.route('/').get(getUsers).post(
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').isIn(['admin', 'clinician', 'receptionist']).withMessage('Invalid role')
  ],
  createUser
);

router.route('/:id').put(userValidation, updateUser).delete(deleteUser);

module.exports = router;
