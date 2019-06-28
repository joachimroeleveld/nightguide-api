const { Router } = require('express');
const multer = require('multer');
const _ = require('lodash');
const moment = require('moment-timezone');

const { deserializeSort } = require('../../shared/util/expressUtils');
const { validator, coerce } = require('../../shared/openapi');
const venueRepository = require('./venueRepository');
const { adminAuth } = require('../../shared/auth');
const { asyncMiddleware } = require('../../shared/util/expressUtils');
const { VENUE_IMAGE_PERSPECTIVES } = require('../../shared/constants');
const eventRepository = require('../events/eventRepository');
const { NotFoundError, InvalidRequestError } = require('../../shared/errors');
const cityConfig = require('../../shared/cityConfig');

const upload = multer();
const router = new Router();

router.get(
  '/',
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
    const populate = req.query.populate || ['images', 'tags'];

    const { results, totalCount } = await venueRepository.getVenues(
      {
        offset,
        limit,
        fields,
        populate,
        sortBy: deserializeSort(req.query.sortBy),
        ids: req.query.ids,
        exclude: req.query.exclude,
        query: req.query.query,
        longitude: req.query.longitude,
        latitude: req.query.latitude,
        city: req.query.city,
        country: req.query.country,
        cat: req.query.cat,
        tag: req.query.tag,
        tags: req.query.tags,
        hasFb: req.query.hasFb,
        musicType: req.query.musicType,
        visitorType: req.query.visitorType,
        paymentMethod: req.query.paymentMethod,
        doorPolicy: req.query.doorPolicy,
        dresscode: req.query.dresscode,
        capRange: req.query.capRange,
        priceClass: req.query.priceClass,
        noEntranceFee: req.query.noEntranceFee,
        noCoatCheckFee: req.query.noCoatCheckFee,
        noBouncers: req.query.noBouncers,
        openTime: req.query.openTime,
        terraceTime: req.query.terraceTime,
        kitchenTime: req.query.kitchenTime,
        busyTime: req.query.busyTime,
        dancingTime: req.query.dancingTime,
        bitesTime: req.query.bitesTime,
        vipArea: req.query.vipArea,
        smokingArea: req.query.smokingArea,
        terrace: req.query.terrace,
        terraceHeaters: req.query.terraceHeaters,
        bouncers: req.query.bouncers,
        kitchen: req.query.kitchen,
        coatCheck: req.query.coatCheck,
        parking: req.query.parking,
        cigarettes: req.query.cigarettes,
        accessible: req.query.accessible,
        pageSlug: req.query.pageSlug,
      },
      true
    );

    res.json({
      results: results.map(venueRepository.deserialize),
      offset,
      limit,
      totalCount,
    });
  })
);

router.post(
  '/',
  adminAuth(),
  validator.validate('post', '/venues'),
  asyncMiddleware(async (req, res, next) => {
    const doc = venueRepository.serialize(req.body);
    const venue = await venueRepository.createVenue(doc);

    res.status(201).json(venue.deserialize());
  })
);

router.get(
  '/:venueId',
  coerce('get', '/venues/{venueId}'),
  validator.validate('get', '/venues/{venueId}'),
  asyncMiddleware(async (req, res, next) => {
    const venue = await venueRepository.getVenue(req.params.venueId, {
      populate: req.query.populate || ['images', 'tags'],
    });

    if (!venue) {
      throw new NotFoundError('venue_not_found');
    }

    res.json(venue.deserialize());
  })
);

router.put(
  '/:venueId',
  adminAuth(),
  validator.validate('put', '/venues/{venueId}'),
  asyncMiddleware(async (req, res, next) => {
    const doc = venueRepository.serialize(req.body);
    const venue = await venueRepository.updateVenue(req.params.venueId, doc, {
      omitUndefined: true,
    });

    res.json(venue.deserialize());
  })
);

router.delete(
  '/:venueId',
  adminAuth(),
  validator.validate('delete', '/venues/{venueId}'),
  asyncMiddleware(async (req, res, next) => {
    let venue = await venueRepository.getVenue(req.params.venueId);

    if (!venue) {
      throw new NotFoundError('venue_not_found');
    }

    await venueRepository.deleteVenue(req.params.venueId);

    res.json({ success: true });
  })
);

router.post(
  '/:venueId/images',
  adminAuth(),
  validator.validate('post', '/venues/{venueId}/images'),
  upload.fields(
    VENUE_IMAGE_PERSPECTIVES.map(perspective => ({
      name: perspective,
      maxCount: 1,
    }))
  ),
  asyncMiddleware(async (req, res, next) => {
    let venue = await venueRepository.getVenue(req.params.venueId);

    if (!venue) {
      throw new NotFoundError('venue_not_found');
    }

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
    const results = images.map(image => image.deserialize());

    res.status(200).json({ results });
  })
);

/**
 * Replace all current and future Facebook events for a venue.
 */
router.put(
  '/:venueId/facebook-events',
  adminAuth(),
  validator.validate('put', '/venues/{venueId}/facebook-events'),
  asyncMiddleware(async (req, res) => {
    const venue = await venueRepository.getVenue(req.params.venueId);

    if (!venue) {
      throw new NotFoundError('venue_not_found');
    }

    const cityConf = cityConfig[venue.pageSlug];
    const currentEvents = await eventRepository.getEvents({
      venueId: req.params.venueId,
      fields: ['facebook.id'],
      isFbEvent: true,
      dateFrom: moment().tz(cityConf.timezone),
    });

    for (const event of req.body) {
      const data = await eventRepository.serialize({
        ...event,
        location: {
          type: 'venue',
        },
        organiser: {
          venue: req.params.venueId,
        },
      });
      if (!_.get(data, 'facebook.id')) {
        throw new InvalidRequestError('missing_facebook_id');
      }
      await eventRepository.updateEvent(
        { 'facebook.id': data.facebook.id },
        data,
        { upsert: true }
      );
    }

    if (currentEvents.length) {
      const oldEventIds = _.difference(
        currentEvents.map(event => event.facebook.id),
        req.body.map(event => event.facebook.id)
      );
      await eventRepository.deleteEvents({
        'facebook.id': { $in: oldEventIds },
      });
    }

    res.status(200).end();
  })
);

module.exports = router;
