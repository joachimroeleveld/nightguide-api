const { Router } = require('express');
const multer = require('multer');

const venueRepository = require('./venueRepository');
const { standardAuth, adminAuth } = require('../../shared/auth');
const { asyncMiddleware } = require('../../shared/util/expressUtils');

const upload = multer();
const router = new Router();

router.get(
  '/',
  standardAuth(),
  asyncMiddleware(async (req, res, next) => {
    const venues = await venueRepository.getVenues();

    const sanitized = venues.map(venue => venue.sanitize());

    res.json(sanitized);
  })
);

router.post(
  '/',
  adminAuth(),
  asyncMiddleware(async (req, res, next) => {
    const venue = await venueRepository.createVenue(req.body);

    res.status(201).json(venue.sanitize());
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
