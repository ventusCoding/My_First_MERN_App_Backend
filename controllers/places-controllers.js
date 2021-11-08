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

exports.getPlaceById = (req, res, next) => {
  const placeId = req.params.pid;
  const place = DUMMY_PLACES.find((p) => {
    return p.id === placeId;
  });

  if (!place) {
    next(new HttpError('Could not find a place for the provided id.', 404));
  }

  res.json({ place });
};

exports.getPlacesByUserId = (req, res, next) => {
  const userId = req.params.uid;

  const places = DUMMY_PLACES.filter((p) => {
    return p.creator === userId;
  });

  if (!places || places.length === 0) {
    next(new HttpError('Could not find a place for the provided id.', 404));
  }

  res.json(places);
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

exports.updatePlace = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new HttpError('Invalid inputs passed, please check your data.', 422);
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  const updatePlace = { ...DUMMY_PLACES.find((p) => p.id === placeId) };
  const placeIndex = DUMMY_PLACES.findIndex((p) => p.id === placeId);
  updatePlace.title = title;
  updatePlace.description = description;

  DUMMY_PLACES[placeIndex] = updatePlace;

  res.status(200).json({ updatePlace });
};

exports.deletePlace = (req, res, next) => {
  const placeId = req.params.pid;
  if (!DUMMY_PLACES.find((p) => p.id === placeId)) {
    throw new HttpError('Could not find a place for that id.', 404);
  }
  DUMMY_PLACES = DUMMY_PLACES.filter((p) => p.id !== placeId);

  res.status(200).json({ message: 'Deleted Place.' });
};
