const { Router } = require('express');

const { adminAuth } = require('../../shared/auth');
const { asyncMiddleware } = require('../../shared/util/expressUtils');
const { validator, coerce } = require('../../shared/openapi');
const artistRepository = require('./artistRepository');

const router = new Router();

router.get(
  '/',
  coerce('get', '/artists'),
  validator.validate('get', '/artists'),
  asyncMiddleware(async (req, res, next) => {
    let artists = await artistRepository.getArtists({
      ids: req.query.ids,
    });

    const json = {
      results: artists.map(artist => artist.deserialize()),
      totalCount: artists.length,
    };

    res.json(json);
  })
);

router.get(
  '/:artistId',
  validator.validate('get', '/artists/{artistId}'),
  asyncMiddleware(async (req, res, next) => {
    const artist = await artistRepository.getArtist(req.params.artistId);

    if (!artist) {
      throw new NotFoundError('artist_not_found');
    }

    res.json(artist.deserialize());
  })
);

router.post(
  '/',
  adminAuth(),
  validator.validate('post', '/artists'),
  asyncMiddleware(async (req, res, next) => {
    const doc = await artistRepository.serialize(req.body);
    const artist = await artistRepository.createArtist(doc);

    res.status(201).json(artist.deserialize());
  })
);

router.put(
  '/:artistId',
  adminAuth(),
  validator.validate('put', '/artists/{artistId}'),
  asyncMiddleware(async (req, res, next) => {
    const doc = await artistRepository.serialize(req.body);
    const artist = await artistRepository.updateArtist(
      req.params.artistId,
      doc,
      {
        omitUndefined: true,
      }
    );

    if (!artist) {
      throw new NotFoundError('artist_not_found');
    }

    res.json(artist.deserialize());
  })
);

router.delete(
  '/:artistId',
  adminAuth(),
  validator.validate('delete', '/artists/{artistId}'),
  asyncMiddleware(async (req, res, next) => {
    let artist = await artistRepository.getArtist(req.params.artistId);

    if (!artist) {
      throw new NotFoundError('artist_not_found');
    }

    await artistRepository.deleteArtist(req.params.artistId);

    res.json({ success: true });
  })
);

module.exports = router;
