const { v4: uuid } = require('uuid');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Place = require('../models/place');
const User = require('../models/user');
const mongoose = require('mongoose');
const axios = require('axios');

let DUMMY_PLACES = [
  {
    id: 'p1',
    title: 'Dar Slah',
    description:
      'El Mrabet is one of the oldest cafes in the Tunis medina, the foundation dates back to the 17th century, more precisely in 1630.',
    imageUrl: 'https://www.darslah.com/wp-content/uploads/minis-briks.jpg',
    address: 'rue de la kasbah la medina',
    location: {
      lat: 36.79886306526196,
      lng: 10.171090724639619,
    },
    creator: 'u1',
  },
  {
    id: 'p2',
    title: 'Dar Jeld',
    description:
      'El Mrabet is one of the oldest cafes in the Tunis medina, the foundation dates back to the 17th century, more precisely in 1630.',
    imageUrl: 'https://www.darslah.com/wp-content/uploads/kabkabou-thon.jpg',
    address: 'rue de la kasbah la medina',
    location: {
      lat: 36.79886306526196,
      lng: 10.171090724639619,
    },
    creator: 'u1',
  },
];

exports.getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }

  if (!place) {
    const error = new HttpError(
      'Could not find a place for the provided id.',
      404,
    );
    return next(error);
  }

  res.json({ place: place.toObject({ getters: true }) });
};

exports.getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  // let places;
  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate('places');
  } catch (err) {
    const error = new HttpError(
      'Fetching places failed, please try again later',
      500
    );
    return next(error);
  }

  // if (!places || places.length === 0) {
  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    return next(
      new HttpError('Could not find places for the provided user id.', 404)
    );
  }

  res.json({
    places: userWithPlaces.places.map(place =>
      place.toObject({ getters: true })
    )
  });
};

exports.createPlace = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    next(new HttpError('Invalid inputs passed, please check your data.', 422));
  }

  const { title, description, address, creator } = req.body;

  const url = `http://api.positionstack.com/v1/forward?access_key=${process.env.API_KEY}&query=${address}`;

  const responseLocation = await axios.get(url);

  if (responseLocation.data.data.length === 0) {
    const error = new HttpError('Could not find that place.', 404);
    return next(error);
  }

  const createPlace = new Place({
    title,
    description,
    address,
    location: {
      lat: responseLocation.data.data[0].latitude,
      lng: responseLocation.data.data[0].longitude,
    },
    image: 'https://www.darslah.com/wp-content/uploads/minis-briks.jpg',
    creator,
  });

  let user;

  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError('Could not find user for provided id', 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createPlace.save({ session: sess });
    user.places.push(createPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Creating place failed, please try again.',
      500
    );
    return next(error);
  }

  res.status(201).json({ createPlace });
};

exports.updatePlace = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new HttpError(
      'Invalid inputs passed, please check your data.',
      422,
    );
    return next(error);
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findByIdAndUpdate(
      placeId,
      {
        title: title,
        description: description,
      },
      {
        new: true,
        runValidators: true,
      },
    );
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

exports.deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate('creator');
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete place.',
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError('Could not find place for this id.', 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete place.',
      500
    );
    return next(error);
  }

  res.status(200).json({ message: 'Deleted place.' });
};
