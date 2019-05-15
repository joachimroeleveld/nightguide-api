const { Router } = require('express');
const multer = require('multer');
const _ = require('lodash');

const { deserializeSort } = require('../../shared/util/expressUtils');
const { validator, coerce } = require('../../shared/openapi');
const { NotFoundError } = require('../../shared/errors');
const eventRepository = require('./eventRepository');
const { adminAuth, checkIsApp } = require('../../shared/auth');
const { asyncMiddleware } = require('../../shared/util/expressUtils');

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
    const fields = req.query.fields || ['title', 'dates', 'location'];
    const populate = fields.filter(field => ['images'].includes(field));

    let { results, totalCount } = await eventRepository.getEvents(
      {
        offset,
        limit,
        fields,
        populate,
        sortBy: deserializeSort(req.query.sortBy),
        venueId: req.query.venue || null,
        isFbEvent: !!req.query.isFbEvent,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom) : null,
        textFilter: req.query.query || null,
        city: req.query.city || null,
        country: req.query.country || null,
      },
      true
    );

    res.json({
      results: results.map(eventRepository.deserialize),
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
    const doc = await eventRepository.serialize(req.body);
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

    if (!event) {
      throw new NotFoundError('event_not_found');
    }

    res.json(event.deserialize());
  })
);

router.put(
  '/:eventId',
  adminAuth(),
  validator.validate('put', '/events/{eventId}'),
  asyncMiddleware(async (req, res, next) => {
    const doc = await eventRepository.serialize(req.body);
    const event = await eventRepository.updateEvent(req.params.eventId, doc, {
      omitUndefined: true,
    });

    if (!event) {
      throw new NotFoundError('event_not_found');
    }

    res.json(event.deserialize());
  })
);

router.post(
  '/:eventId/images',
  adminAuth(),
  validator.validate('post', '/events/{eventId}/images'),
  upload.array('images', 10),
  asyncMiddleware(async (req, res, next) => {
    const event = await eventRepository.getEvent(req.params.eventId);
    if (!event) {
      throw new NotFoundError('event_not_found');
    }

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
    const results = images.map(image => image.deserialize());

    res.status(200).json({ results });
  })
);

router.put(
  '/facebook-events/:fbEventId/image',
  adminAuth(),
  validator.validate('put', '/events/facebook-events/{fbEventId}/image'),
  upload.single('image'),
  asyncMiddleware(async (req, res, next) => {
    const event = await eventRepository.getEventByFbId(req.params.fbEventId, {
      populate: ['images'],
    });
    if (!event) {
      throw new NotFoundError('event_not_found');
    }

    const newUrl = req.body.image.url;
    const oldFbImage = _.find(event.images, image => !!image.fbUrl);

    if (oldFbImage && oldFbImage.fbUrl === newUrl) {
      return res.json({ skipped: true });
    }

    const image = await eventRepository.uploadEventImageByUrl(event._id, {
      url: newUrl,
      fbUrl: newUrl,
    });

    if (oldFbImage) {
      await eventRepository.deleteEventImageById(event._id, oldFbImage._id);
    }

    res.json({
      updated: !!oldFbImage,
      result: image.deserialize(),
    });
  })
);

module.exports = router;
