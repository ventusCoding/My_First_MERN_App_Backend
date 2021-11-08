const { v4: uuid } = require('uuid');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Place = require('../models/place');

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

  let places;
  try {
    places = await Place.find({ creator: userId });
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }

  if (!places || places.length === 0) {
    const error = new HttpError(
      'Could not find a place for the provided user id.',
      404,
    );
    return next(error);
  }

  res.json({
    places: places.map((place) => place.toObject({ getters: true })),
  });
};

exports.createPlace = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    next(new HttpError('Invalid inputs passed, please check your data.', 422));
  }

  const { title, location, description, address, creator } = req.body;

  // let coordinates;
  // try {
  //   coordinates = await getCoordsForAddress(address);
  // } catch (error) {
  //   return next(error);
  // }

  const createPlace = new Place({
    title,
    description,
    address,
    location,
    image: 'https://www.darslah.com/wp-content/uploads/minis-briks.jpg',
    creator,
  });

  try {
    await createPlace.save();
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }

  res.status(201).json({ createPlace });
};

exports.updatePlace = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new HttpError('Invalid inputs passed, please check your data.', 422);
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
    place = await Place.findByIdAndDelete(placeId);
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }

  res.status(200).json({ message: 'Deleted Place.' });
};
