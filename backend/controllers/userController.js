const { validationResult } = require('express-validator');
const User = require('../models/User');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    next(new Error(errors.array().map((error) => error.msg).join(', ')));
    return false;
  }
  return true;
};

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  if (!handleValidation(req, res, next)) return;

  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  if (!handleValidation(req, res, next)) return;

  try {
    const update = { ...req.body };
    if (!update.password) delete update.password;

    const user = await User.findById(req.params.id).select('+password');
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    Object.assign(user, update);
    await user.save();
    user.password = undefined;
    res.json(user);
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      res.status(400);
      throw new Error('You cannot delete your own account');
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    res.json({ message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser };
