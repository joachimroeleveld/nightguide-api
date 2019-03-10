const { Router } = require('express');
const multer = require('multer');

const { deserializeSort } = require('../../shared/util/expressUtils');
const { validator, coerce } = require('../../shared/openapi');
const venueRepository = require('./venueRepository');
const Venue = require('./venueModel');
const { standardAuth, adminAuth } = require('../../shared/auth');
const { asyncMiddleware } = require('../../shared/util/expressUtils');
const VenueImage = require('../venues/venueImageModel');
const { IMAGE_PERSPECTIVES } = require('../../shared/constants');

const upload = multer();
const router = new Router();

router.get(
  '/',
  standardAuth(),
  coerce('get', '/venues'),
  validator.validate('get', '/venues'),
  asyncMiddleware(async (req, res, next) => {
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 20;
    const fields = req.query.fields || [
      'name',
      'description',
      'categories',
      'location',
      'website',
      'facebook',
    ];
    const populate = fields.filter(field => ['images'].includes(field));

    const venues = await venueRepository.getVenues({
      offset,
      limit,
      fields,
      populate,
      filter: req.query.filter,
      sortBy: deserializeSort(req.query.sortBy),
      query: req.query.query,
      longitude: req.query.longitude,
      latitude: req.query.latitude,
    });

    const results = venues.map(Venue.deserialize);

    res.json({
      results,
      offset,
      limit,
    });
  })
);

router.post(
  '/',
  adminAuth(),
  validator.validate('post', '/venues'),
  asyncMiddleware(async (req, res, next) => {
    const doc = Venue.serialize(req.body);
    const venue = await venueRepository.createVenue(doc);

    res.status(201).json(venue.deserialize());
  })
);

router.get(
  '/:venueId',
  standardAuth(),
  validator.validate('get', '/venues/{venueId}'),
  asyncMiddleware(async (req, res, next) => {
    const venue = await venueRepository.getVenue(req.params.venueId, {
      populate: ['images'],
    });

    res.json(venue.deserialize());
  })
);

router.put(
  '/:venueId',
  adminAuth(),
  validator.validate('put', '/venues/{venueId}'),
  asyncMiddleware(async (req, res, next) => {
    const doc = Venue.serialize(req.body);
    const venue = await venueRepository.updateVenue(req.params.venueId, doc);

    res.json(venue.deserialize());
  })
);

router.post(
  '/:venueId/images',
  adminAuth(),
  validator.validate('post', '/venues/{venueId}/images'),
  upload.fields(
    IMAGE_PERSPECTIVES.map(perspective => ({ name: perspective, maxCount: 1 }))
  ),
  asyncMiddleware(async (req, res, next) => {
    let promises;
    if (req.files) {
      promises = Object.keys(req.files).map(perspective => {
        const file = req.files[perspective].shift();
        return venueRepository.uploadVenueImage(req.params.venueId, {
          buffer: file.buffer,
          mime: file.mimetype,
          perspective,
        });
      });
    } else {
      promises = req.body.images.map(image =>
        venueRepository.uploadVenueImageByUrl(req.params.venueId, image)
      );
    }

    let images = await Promise.all(promises);
    const results = images.map(VenueImage.deserialize);

    res.status(200).json({ results });
  })
);

module.exports = router;
