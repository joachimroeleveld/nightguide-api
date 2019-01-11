const { Router } = require('express');
const multer = require('multer');

const validator = require('../../shared/validator');
const venueRepository = require('./venueRepository');
const { standardAuth, adminAuth } = require('../../shared/auth');
const { asyncMiddleware } = require('../../shared/util/expressUtils');

const upload = multer();
const router = new Router();

router.get(
  '/',
  standardAuth(),
  validator.validate('get', '/venues'),
  asyncMiddleware(async (req, res, next) => {
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 20;
    const fields = req.query.fields || [
      'name',
      'description',
      'category',
      'location',
      'website',
      'facebook',
    ];

    const venues = await venueRepository.getVenues({
      offset,
      limit,
      fields,
      filter: req.query.filter,
      sort: req.query.sort,
    });

    const sanitized = venues.map(venue => venue.sanitize());

    res.json({
      results: sanitized,
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
    const venue = await venueRepository.createVenue(req.body);

    res.status(201).json(venue.sanitize());
  })
);

router.put(
  '/:venueId',
  adminAuth(),
  validator.validate('put', '/venues/{venueId}'),
  asyncMiddleware(async (req, res, next) => {
    const venue = await venueRepository.updateVenue(
      req.params.venueId,
      req.body
    );

    res.json(venue.sanitize());
  })
);

router.post(
  '/:venueId/images',
  adminAuth(),
  upload.single('image'),
  asyncMiddleware(async (req, res, next) => {
    const image = await venueRepository.uploadVenueImage(req.params.venueId, {
      buffer: req.file.buffer,
      mime: req.file.mimetype,
      name: req.file.originalname,
      size: req.file.size,
    });

    res.status(200).json(image.sanitize());
  })
);

module.exports = router;
