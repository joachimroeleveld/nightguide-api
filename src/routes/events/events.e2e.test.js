require('../../shared/__test__/testBootstrap');

const fs = require('fs');
const nodeRequest = require('request-promise-native');
const request = require('supertest');
const sinon = require('sinon');
const _ = require('lodash');

const Event = require('./eventModel');
const { validator } = require('../../shared/openapi');
const imagesService = require('../../shared/services/images');
const {
  TEST_EVENT_1,
  TEST_EVENT_2,
  TEST_VENUE_1,
  TEST_VENUE_2,
} = require('../../shared/__test__/fixtures');
const { clearDb } = require('../../shared/__test__/testUtils');
const eventRepository = require('./eventRepository');
const venueRepository = require('../venues/venueRepository');
const { COUNTRIES } = require('../../shared/constants');

const EVENT_SNAPSHOT_MATCHER = {
  id: expect.any(String),
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
};

const sandbox = sinon.createSandbox();

describe('events e2e', () => {
  beforeEach(async () => {
    sandbox.restore();
    await clearDb();
  });

  describe('GET /events', () => {
    const validateResponse = validator.validateResponse('get', '/events');

    it('happy path', async () => {
      await eventRepository.createEvent(TEST_EVENT_1);

      const res = await request(global.app).get('/events');

      expect(res.status).toEqual(200);
      expect(res.body.results[0]).toMatchInlineSnapshot(
        `
Object {
  "date": Object {
    "from": "2020-01-10T23:00:00.000Z",
    "to": "2019-10-11T22:00:00.000Z",
  },
  "id": "5cab012f2830a46462316889",
  "location": Object {
    "address1": "Vechtplantsoen 56",
    "address2": "1",
    "city": "Utrecht",
    "coordinates": Object {
      "latitude": 52.118273,
      "longitude": 5.085487,
    },
    "country": "NL",
    "postalCode": "3554TG",
    "type": "address",
  },
  "title": "Bevrijdingsfestival",
}
`,
        EVENT_SNAPSHOT_MATCHER
      );
      expect(validateResponse(res)).toBeUndefined();
    });

    it('should limit the amount of results to the limit parameter', async () => {
      const event1 = await eventRepository.createEvent(TEST_EVENT_1);
      await eventRepository.createEvent(TEST_EVENT_2);

      const res = await request(global.app)
        .get('/events')
        .query({
          limit: 1,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toEqual(1);
      expect(res.body.limit).toEqual(1);
      expect(res.body.results[0].id).toEqual(event1._id.toString());
      expect(validateResponse(res)).toBeUndefined();
    });

    it('should return only fields set in the fields parameter', async () => {
      await eventRepository.createEvent(TEST_EVENT_1);

      const res = await request(global.app)
        .get('/events')
        .query({
          fields: ['title'],
        });

      expect(res.status).toEqual(200);
      expect(res.body.results[0]).toMatchObject(
        _.pick(TEST_EVENT_1, ['id', 'title'])
      );
      expect(validateResponse(res)).toBeUndefined();
    });

    it('should filter results on name based on query parameter', async () => {
      await eventRepository.createEvent({
        ...TEST_EVENT_1,
        queryText: 'tobefiltered',
      });
      await eventRepository.createEvent(TEST_EVENT_2);

      const res = await request(global.app)
        .get('/events')
        .query({
          query: 'tobefiltered',
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].name).toBe(TEST_EVENT_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('return a totalCount with each result', async () => {
      await eventRepository.createEvent(TEST_EVENT_1);
      await eventRepository.createEvent(TEST_EVENT_2);

      sandbox
        .stub(eventRepository, 'getEvents')
        .resolves([await eventRepository.getEvent(TEST_EVENT_1._id)]);

      const res = await request(global.app).get('/events');

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.totalCount).toBe(2);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('should handle special characters in search queries', async () => {
      await eventRepository.createEvent({
        ...TEST_EVENT_1,
        queryText: 'cafe',
      });
      await eventRepository.createEvent(TEST_EVENT_2);

      const res = await request(global.app)
        .get('/events')
        .query({
          query: 'café',
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].name).toBe(TEST_EVENT_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('city filter - address location', async () => {
      await eventRepository.createEvent({
        ...TEST_EVENT_1,
        location: {
          ...TEST_EVENT_1.location,
          city: 'Amsterdam',
        },
      });
      await eventRepository.createEvent({
        ...TEST_EVENT_2,
        location: {
          ...TEST_EVENT_2.location,
          city: 'Utrecht',
        },
      });

      const res = await request(global.app)
        .get('/events')
        .query({
          filter: {
            country: 'NL',
            city: 'Amsterdam',
          },
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].name).toBe(TEST_EVENT_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('country filter - address location', async () => {
      await eventRepository.createEvent({
        ...TEST_EVENT_1,
        location: {
          ...TEST_EVENT_1.location,
          country: 'NL',
        },
      });
      await eventRepository.createEvent({
        ...TEST_EVENT_2,
        location: {
          ...TEST_EVENT_1.location,
          country: 'DE',
        },
      });

      const res = await request(global.app)
        .get('/events')
        .query({
          filter: {
            country: 'NL',
          },
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].name).toBe(TEST_EVENT_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('city filter - venue location', async () => {
      const venue1 = await venueRepository.createVenue(
        _.set({ ...TEST_VENUE_1 }, 'location.city', 'Amsterdam')
      );
      const venue2 = await venueRepository.createVenue(
        _.set({ ...TEST_VENUE_2 }, 'location.city', 'Utrecht')
      );

      await eventRepository.createEvent(
        await Event.serialize({
          ...TEST_EVENT_1,
          organiser: {
            type: 'venue',
            venue: venue1._id.toString(),
          },
          location: {
            type: 'venue',
          },
        })
      );
      await eventRepository.createEvent(
        await Event.serialize({
          ...TEST_EVENT_2,
          organiser: {
            type: 'venue',
            venue: venue2._id.toString(),
          },
          location: {
            type: 'venue',
          },
        })
      );

      const res = await request(global.app)
        .get('/events')
        .query({
          filter: {
            country: venue1.location.country,
            city: 'Amsterdam',
          },
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].name).toBe(TEST_EVENT_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('country filter - venue location', async () => {
      const venue1 = await venueRepository.createVenue(
        _.set(
          { ...TEST_VENUE_1 },
          'location.country',
          TEST_EVENT_1.location.country
        )
      );
      const venue2 = await venueRepository.createVenue(
        _.set({ ...TEST_VENUE_2 }, 'location.country', COUNTRIES.COUNTRY_BE)
      );

      await eventRepository.createEvent(
        await Event.serialize({
          ...TEST_EVENT_1,
          organiser: {
            type: 'venue',
            venue: venue1._id.toString(),
          },
          location: {
            type: 'venue',
          },
        })
      );
      await eventRepository.createEvent(
        await Event.serialize({
          ...TEST_EVENT_2,
          organiser: {
            type: 'venue',
            venue: venue2._id.toString(),
          },
          location: {
            type: 'venue',
          },
        })
      );

      const res = await request(global.app)
        .get('/events')
        .query({
          filter: {
            country: TEST_EVENT_1.location.country,
          },
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].name).toBe(TEST_EVENT_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('POST /events', () => {
    const validateResponse = validator.validateResponse('post', '/events');

    it('happy path', async () => {
      const res = await request(global.app)
        .post('/events')
        .send(Event.deserialize(TEST_EVENT_1));
      const body = res.body;

      expect(res.status).toEqual(201);
      expect(body.name).toEqual(TEST_EVENT_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('GET /events/:eventId', () => {
    const validateResponse = validator.validateResponse(
      'get',
      '/events/{eventId}'
    );

    it('happy path', async () => {
      const event1 = await eventRepository.createEvent(TEST_EVENT_1);

      const res = await request(global.app)
        .get(`/events/${event1._id}`)
        .send()
        .expect(200);

      expect(res.body).toMatchSnapshot(EVENT_SNAPSHOT_MATCHER);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('simple fields', async () => {
      const event1 = await eventRepository.createEvent({
        ...TEST_EVENT_1,
        date: {
          from: new Date(2019, 12, 11),
          to: new Date(2019, 9, 12),
        },
        description: {
          en: 'Simple description',
        },
        location: {
          ...TEST_EVENT_1.location,
          address2: '1',
        },
      });

      const res = await request(global.app)
        .get(`/events/${event1._id}`)
        .send()
        .expect(200);

      expect(res.body).toMatchSnapshot(EVENT_SNAPSHOT_MATCHER);
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('PUT /events/:eventId', () => {
    const validateResponse = validator.validateResponse(
      'put',
      '/events/{eventId}'
    );

    it('happy path', async () => {
      const event = await eventRepository.createEvent(TEST_EVENT_1);

      const res = await request(global.app)
        .put(`/events/${event._id}`)
        .send({
          ...Event.deserialize(TEST_EVENT_1),
          title: 'Other title',
        });

      const updatedEvent = await eventRepository.getEvent(event._id);

      expect(res.status).toEqual(200);
      expect(res.body.title).toEqual('Other title');
      expect(updatedEvent.title).toEqual('Other title');
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('POST /events/:eventId/images', () => {
    const validateResponse = validator.validateResponse(
      'post',
      '/events/{eventId}/images'
    );
    const imagePath = 'src/shared/__test__/fixtures/images/square.jpg';

    it('happy path - multipart', async () => {
      const event = await eventRepository.createEvent(TEST_EVENT_1);

      sandbox.stub(imagesService, 'upload').resolves();
      sandbox.stub(imagesService, 'getServeableUrl').resolves('testurl');

      const res = await request(global.app)
        .post(`/events/${event.id}/images`)
        .attach('images', imagePath);

      expect(res.status).toEqual(200);
      expect(res.body.results[0].url).toEqual('testurl');
      expect(res.body.results[0].filesize).toEqual(1884);
      expect(res.body.results[0].filetype).toEqual('image/jpeg');
      expect(res.body.results[0].width).toEqual(400);
      expect(res.body.results[0].height).toEqual(400);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('happy path - url', async () => {
      const event = await eventRepository.createEvent(TEST_EVENT_1);

      sandbox.stub(imagesService, 'upload').resolves();
      sandbox.stub(imagesService, 'getServeableUrl').resolves('testurl');
      sandbox.stub(nodeRequest, 'get').resolves({
        body: fs.readFileSync(imagePath),
        headers: {
          'content-type': 'image/jpeg',
        },
      });

      const res = await request(global.app)
        .post(`/events/${event.id}/images`)
        .send({
          images: [
            {
              url: 'http://testurl.com',
            },
          ],
        });

      expect(res.status).toEqual(200);
      expect(res.body.results[0].url).toEqual('testurl');
      expect(res.body.results[0].filesize).toEqual(1884);
      expect(res.body.results[0].filetype).toEqual('image/jpeg');
      expect(res.body.results[0].width).toEqual(400);
      expect(res.body.results[0].height).toEqual(400);
      expect(validateResponse(res)).toBeUndefined();
    });
  });
});
