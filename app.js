const express = require('express');
const bodyParser = require('body-parser');
const HttpError = require('./models/http-error');
const mongoose = require('mongoose');
const dotenv = require('dotenv');


dotenv.config();

const placesRoutes = require('./routes/places-routes');
const usersRoutes = require('./routes/users-routes');

const app = express();

app.use(bodyParser.json());

app.use('/api/places', placesRoutes);
app.use('/api/users', usersRoutes);

app.use((req, res, next) => {
  next(new HttpError('Could not find this route.', 404));
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500).json({
    message: error.message || 'An unknown error occurred!',
  });
});

mongoose
  .connect(process.env.MONGODB_ACCESS)
  .then(() => {
    app.listen(5000);
  })
  .catch((err) => {
    console.log(err);
  });
