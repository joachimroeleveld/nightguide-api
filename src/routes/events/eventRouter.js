const { Router } = require('express');
const multer = require('multer');

const { deserializeSort } = require('../../shared/util/expressUtils');
const { validator, coerce } = require('../../shared/openapi');
const eventRepository = require('./eventRepository');
const Event = require('./eventModel');
const { adminAuth, checkIsApp } = require('../../shared/auth');
const { asyncMiddleware } = require('../../shared/util/expressUtils');
const EventImage = require('./eventImageModel');
const {
  createFilterFromValues,
  createLocationFilterFromValues,
} = require('./lib/filters');

const upload = multer();
const router = new Router();

router.get(
  '/',
  checkIsApp(),
  coerce('get', '/events'),
  validator.validate('get', '/events'),
  asyncMiddleware(async (req, res, next) => {
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 20;
    const fields = req.query.fields || ['title', 'date', 'location'];
    const populate = fields.filter(field => ['images'].includes(field));

    const filterValues = {
      ...req.query.filter,
      query: req.query.query,
    };
    const locationFilter = createLocationFilterFromValues(filterValues);
    const filter = createFilterFromValues(filterValues);

    const events = await eventRepository.getEvents({
      offset,
      limit,
      fields,
      populate,
      filter,
      locationFilter,
      sortBy: deserializeSort(req.query.sortBy),
    });

    const totalCount = await Event.count(filter).exec();
    const results = events.map(Event.deserialize);

    res.json({
      results,
      offset,
      limit,
      totalCount,
    });
  })
);

router.post(
  '/',
  adminAuth(),
  validator.validate('post', '/events'),
  asyncMiddleware(async (req, res, next) => {
    const doc = await Event.serialize(req.body);
    const event = await eventRepository.createEvent(doc);

    res.status(201).json(event.deserialize());
  })
);

router.get(
  '/:eventId',
  checkIsApp(),
  validator.validate('get', '/events/{eventId}'),
  asyncMiddleware(async (req, res, next) => {
    const event = await eventRepository.getEvent(req.params.eventId, {
      populate: ['images'],
    });

    res.json(event.deserialize());
  })
);

router.put(
  '/:eventId',
  adminAuth(),
  validator.validate('put', '/events/{eventId}'),
  asyncMiddleware(async (req, res, next) => {
    const doc = await Event.serialize(req.body);
    const event = await eventRepository.updateEvent(req.params.eventId, doc, {
      omitUndefined: true,
    });

    res.json(event.deserialize());
  })
);

router.post(
  '/:eventId/images',
  adminAuth(),
  validator.validate('post', '/events/{eventId}/images'),
  upload.array('images', 10),
  asyncMiddleware(async (req, res, next) => {
    let promises;
    if (req.files) {
      promises = req.files.map(file => {
        return eventRepository.uploadEventImage(req.params.eventId, {
          buffer: file.buffer,
          mime: file.mimetype,
        });
      });
    } else {
      promises = req.body.images.map(image =>
        eventRepository.uploadEventImageByUrl(req.params.eventId, image)
      );
    }

    let images = await Promise.all(promises);
    const results = images.map(EventImage.deserialize);

    res.status(200).json({ results });
  })
);

module.exports = router;
