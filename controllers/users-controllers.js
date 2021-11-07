const HttpError = require('../models/http-error');
const { v4: uuid } = require('uuid');
const { validationResult } = require('express-validator');

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

exports.getUsers = (req, res, next) => {
  res.status(200).json(DUMMY_USERS);
};

exports.signup = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new HttpError('Invalid inputs passed, please check your data.', 422);
  }
  const { name, email, password } = req.body;

  const createdUser = {
    id: uuid(),
    name,
    email,
    password,
  };

  DUMMY_USERS.push(createdUser);

  res.status(201).json({ createdUser });
};

exports.login = (req, res, next) => {
  const { email, password } = req.body;

  const identifiedUser = DUMMY_USERS.find((u) => u.email === email);

  if (!identifiedUser || identifiedUser.password !== password) {
    throw new HttpError(
      'Could not identify user, creadentials seem to be wrong.',
      401,
    );
  }

  res.json({ message: 'Logged In' });
};
