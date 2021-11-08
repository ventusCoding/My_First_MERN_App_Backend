const HttpError = require('../models/http-error');
const { v4: uuid } = require('uuid');
const { validationResult } = require('express-validator');
const User = require('../models/user');

const DUMMY_USERS = [
  {
    id: 'u1',
    image: 'https://randomuser.me/api/portraits/men/1.jpg',
    name: 'User 1',
    email: 'user1@test.com',
    password: '123456',
  },
  {
    id: 'u2',
    image: 'https://randomuser.me/api/portraits/men/2.jpg',
    name: 'User 2',
    email: 'user2@test.com',
    password: '123456',
  },
  {
    id: 'u3',
    image: 'https://randomuser.me/api/portraits/men/3.jpg',
    name: 'User 3',
    email: 'user3@test.com',
    password: '123456',
  },
];

exports.getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, '-password');
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }

  res
    .status(200)
    .json({ users: users.map((user) => user.toObject({ getters: true })) });
};

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new HttpError(
      'Invalid inputs passed, please check your data.',
      422,
    );
    return next(error);
  }
  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      'User exists already,please login instead.',
      422,
    );
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    image: 'https://randomuser.me/api/portraits/men/1.jpg',
    password, //TODO: crypt the password
    places: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }

  res.status(201).json({ user: createdUser.toObject({ getters: true }) });
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }

  if (!existingUser || existingUser.password !== password) {
    const error = new HttpError(
      'Invalid credentials, Could not log you in.',
      500,
    );
    return next(error);
  }

  res.json({ message: 'Logged In' });
};
