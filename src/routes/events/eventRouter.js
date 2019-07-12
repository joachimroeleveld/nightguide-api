const { Router } = require('express');
const multer = require('multer');
const _ = require('lodash');

const { deserializeSort } = require('../../shared/util/expressUtils');
const { validator, coerce } = require('../../shared/openapi');
const { NotFoundError } = require('../../shared/errors');
const eventRepository = require('./eventRepository');
const { adminAuth } = require('../../shared/auth');
const { asyncMiddleware } = require('../../shared/util/expressUtils');

const upload = multer();
const router = new Router();

router.get(
  '/',
  coerce('get', '/events'),
  validator.validate('get', '/events'),
  asyncMiddleware(async (req, res, next) => {
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 20;
    const fields = req.query.fields || ['title', 'date', 'location'];
    const populate = req.query.populate || [
      'images',
      'tags',
      'organiser.venue',
    ];

    const defaultSort = {
      'date.interestedCount': -1,
      'date.from': 1,
      _id: 1,
    };

    let { results, totalCount } = await eventRepository.getEvents(
      {
        offset,
        limit,
        fields,
        populate,
        sortBy: deserializeSort(req.query.sortBy) || defaultSort,
        venueId: req.query.venue,
        isFbEvent: req.query.isFbEvent,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo) : undefined,
        textFilter: req.query.text,
        city: req.query.city,
        country: req.query.country,
        ids: req.query.ids,
        tag: req.query.tag,
        tags: req.query.tags,
        exclude: req.query.exclude,
        tagged: req.query.tagged,
        pageSlug: req.query.pageSlug,
        showHidden: req.query.showHidden,
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
  coerce('get', '/events/{eventId}'),
  validator.validate('get', '/events/{eventId}'),
  asyncMiddleware(async (req, res, next) => {
    const populate = req.query.populate || [
      'images',
      'tags',
      'artists',
      'organiser.venue',
      'dates.artists',
    ];

    const event = await eventRepository.getEvent(req.params.eventId, {
      populate,
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

router.delete(
  '/:eventId/images/:imageId',
  adminAuth(),
  validator.validate('delete', '/events/{eventId}/images/{imageId}'),
  asyncMiddleware(async (req, res, next) => {
    const event = await eventRepository.getEvent(req.params.eventId);

    if (!event) {
      throw new NotFoundError('event_not_found');
    }
    if (!event.images.includes(req.params.imageId)) {
      throw new NotFoundError('image_not_found');
    }

    await eventRepository.deleteEventImageById(
      req.params.eventId,
      req.params.imageId
    );

    res.json({ success: true });
  })
);

router.get(
  '/facebook-events/:fbEventId',
  validator.validate('get', '/events/facebook-events/{fbEventId}'),
  asyncMiddleware(async (req, res, next) => {
    const event = await eventRepository.getEventByFbId(req.params.fbEventId);
    if (!event) {
      throw new NotFoundError('event_not_found');
    }

    // Forward to GET /event/:eventId
    req.url = `/${event._id.toString()}`;
    return router.handle(req, res, next);
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

router.delete(
  '/:eventId',
  adminAuth(),
  validator.validate('delete', '/events/{eventId}'),
  asyncMiddleware(async (req, res, next) => {
    const event = await eventRepository.getEvent(req.params.eventId);
    if (!event) {
      throw new NotFoundError('event_not_found');
    }

    for (const imageId of event.images) {
      await eventRepository.deleteEventImageById(req.params.eventId, imageId);
    }

    await eventRepository.deleteEvent(req.params.eventId);

    res.json({ success: true });
  })
);

module.exports = router;
