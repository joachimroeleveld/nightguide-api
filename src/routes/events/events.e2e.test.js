require('../../shared/__test__/testBootstrap');

const fs = require('fs');
const nodeRequest = require('request-promise-native');
const request = require('supertest');
const sinon = require('sinon');
const _ = require('lodash');
const update = require('immutability-helper');

const Event = require('./eventModel');
const { validator } = require('../../shared/openapi');
const imagesService = require('../../shared/services/images');
const {
  TEST_EVENT_1,
  TEST_EVENT_2,
  TEST_TAG_1,
  TEST_TAG_2,
  TEST_FACEBOOK_EVENT_1,
  TEST_VENUE_1,
  TEST_ARTIST_1,
  IMAGE_FIXTURE_PATH,
} = require('../../shared/__test__/fixtures');
const {
  resetDb,
  generateMongoFixture,
} = require('../../shared/__test__/testUtils');
const eventRepository = require('./eventRepository');
const venueRepository = require('../venues/venueRepository');
const tagRepository = require('../tags/tagRepository');
const artistRepository = require('../artists/artistRepository');
const imageRepository = require('../images/imageRepository');

const EVENT_SNAPSHOT_MATCHER = {
  id: expect.any(String),
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
};

const EVENT_PRODUCT_MATCHER = {
  id: expect.any(String),
};

const sandbox = sinon.createSandbox();

describe('events e2e', () => {
  beforeEach(async () => {
    sandbox.restore();
    await resetDb();
    await Event.syncIndexes();
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
    "artists": Array [],
    "from": "2019-12-11T11:16:14.157Z",
    "id": "5d2861d4314defa5a500e11c",
    "to": "2019-09-12T11:16:14.157Z",
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
          sortBy: 'id:asc',
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toEqual(1);
      expect(res.body.limit).toEqual(1);
      expect(res.body.results[0].id).toEqual(event1._id.toString());
      expect(validateResponse(res)).toBeUndefined();
    });

    it('should skip items set in offset parameter', async () => {
      await eventRepository.createEvent(TEST_EVENT_1);
      const event2 = await eventRepository.createEvent(TEST_EVENT_2);

      const res = await request(global.app)
        .get('/events')
        .query({
          offset: 1,
          sortBy: 'id:asc',
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toEqual(1);
      expect(res.body.offset).toEqual(1);
      expect(res.body.results[0].id).toEqual(event2._id.toString());
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

    it('should filter results on name based on text parameter', async () => {
      await eventRepository.createEvent({
        ...TEST_EVENT_1,
        queryText: 'tobefiltered',
      });
      await eventRepository.createEvent(TEST_EVENT_2);

      const res = await request(global.app)
        .get('/events')
        .query({
          text: 'tobefiltered',
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].name).toBe(TEST_EVENT_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('return a totalcount with each result', async () => {
      await eventRepository.createEvent(TEST_EVENT_1);
      await eventRepository.createEvent(TEST_EVENT_2);

      const res = await request(global.app)
        .get('/events')
        .query({ limit: 1 });

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
          text: 'café',
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].name).toBe(TEST_EVENT_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('city filter', async () => {
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
          country: 'NL',
          city: 'Amsterdam',
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].name).toBe(TEST_EVENT_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('tag filter', async () => {
      const tag1 = await tagRepository.createTag(TEST_TAG_1);
      const event1 = await eventRepository.createEvent({
        ...TEST_EVENT_1,
        tags: [tag1._id.toString()],
      });
      await eventRepository.createEvent(TEST_EVENT_2);

      const res = await request(global.app)
        .get('/events')
        .query({ tag: [tag1._id.toString()] });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].id).toBe(event1._id.toString());
      expect(validateResponse(res)).toBeUndefined();
    });

    it('tags filter', async () => {
      const tag1 = await tagRepository.createTag(TEST_TAG_1);
      const tag2 = await tagRepository.createTag(TEST_TAG_2);
      const event1 = await eventRepository.createEvent(
        generateMongoFixture(TEST_EVENT_1)
      );
      const event2 = await eventRepository.createEvent({
        ...TEST_EVENT_1,
        tags: [tag1._id.toString()],
      });
      const event3 = await eventRepository.createEvent({
        ...TEST_EVENT_2,
        tags: [tag1._id.toString(), tag2._id.toString()],
      });

      const res = await request(global.app)
        .get('/events')
        .query({
          tags: [tag1._id.toString(), tag2._id.toString()],
          sortBy: 'tagsMatchScore:desc',
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(2);
      expect(res.body.results[0].id).toBe(event3._id.toString());
      expect(res.body.results[1].id).toBe(event2._id.toString());
      expect(validateResponse(res)).toBeUndefined();
    });

    it('tagged filter', async () => {
      const tag1 = await tagRepository.createTag(TEST_TAG_1);
      const event1 = await eventRepository.createEvent({
        ...TEST_EVENT_1,
        tags: [tag1._id.toString()],
      });
      await eventRepository.createEvent(TEST_EVENT_2);

      const res = await request(global.app)
        .get('/events')
        .query({ tagged: true });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].id).toBe(event1._id.toString());
      expect(validateResponse(res)).toBeUndefined();
    });

    it('datesChanged filter', async () => {
      const event1 = await eventRepository.createEvent(
        update(TEST_FACEBOOK_EVENT_1, {
          facebook: { datesChanged: { $set: true } },
        })
      );
      await eventRepository.createEvent(TEST_EVENT_2);

      const res = await request(global.app)
        .get('/events')
        .query({ datesChanged: true });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].id).toBe(event1._id.toString());
      expect(validateResponse(res)).toBeUndefined();
    });

    it('pageSlug filter', async () => {
      await eventRepository.createEvent({
        ...TEST_EVENT_1,
        pageSlug: 'nl/utrecht',
      });
      await eventRepository.createEvent({
        ...TEST_EVENT_2,
        pageSlug: 'es/ibiza',
      });

      const res = await request(global.app)
        .get('/events')
        .query({
          pageSlug: 'nl/utrecht',
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].name).toBe(TEST_EVENT_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('country filter', async () => {
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
          country: 'NL',
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].name).toBe(TEST_EVENT_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('ids filter', async () => {
      const event1 = await eventRepository.createEvent(TEST_EVENT_1);
      const event2 = await eventRepository.createEvent(TEST_EVENT_2);
      await eventRepository.createEvent(generateMongoFixture(TEST_EVENT_1));

      const ids = [event1._id.toString(), event2._id.toString()];

      const res = await request(global.app)
        .get('/events')
        .query({
          ids,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(2);
      expect(res.body.results.map(item => item.id).sort()).toEqual(ids.sort());
      expect(validateResponse(res)).toBeUndefined();
    });

    it('artist filter', async () => {
      const artist1 = await artistRepository.createArtist(TEST_ARTIST_1);
      const event1 = await eventRepository.createEvent({
        ...TEST_EVENT_1,
        dates: [
          {
            ...TEST_EVENT_1.dates[0],
            artists: [artist1._id.toString()],
          },
        ],
      });
      await eventRepository.createEvent(TEST_EVENT_2);

      const res = await request(global.app)
        .get('/events')
        .query({
          artist: [artist1._id.toString()],
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].id).toBe(event1._id.toString());
      expect(validateResponse(res)).toBeUndefined();
    });

    it('venue filter', async () => {
      const venue1 = await venueRepository.createVenue(TEST_VENUE_1);
      const event1 = await eventRepository.createEvent({
        ...TEST_EVENT_1,
        organiser: { venue: venue1._id.toString() },
      });
      const event2 = await eventRepository.createEvent(TEST_EVENT_2);

      const res = await request(global.app)
        .get('/events')
        .query({
          venue: venue1._id.toString(),
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].id).toBe(event1._id.toString());
      expect(validateResponse(res)).toBeUndefined();
    });

    it('exclude filter', async () => {
      const event1 = await eventRepository.createEvent(TEST_EVENT_1);
      const event2 = await eventRepository.createEvent(TEST_EVENT_2);

      const res = await request(global.app)
        .get('/events')
        .query({
          exclude: event1._id.toString(),
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].id).toEqual(event2._id.toString());
      expect(validateResponse(res)).toBeUndefined();
    });

    it('dateFrom filter', async () => {
      const pastEvent = generateMongoFixture(TEST_EVENT_1, {
        dates: [
          {
            from: new Date(2018, 1, 1),
            to: new Date(2018, 1, 2),
          },
        ],
      });
      const futureEvent = generateMongoFixture(TEST_EVENT_1, {
        dates: [
          {
            from: new Date(2050, 1, 1),
            to: new Date(2050, 1, 2),
          },
        ],
      });

      await eventRepository.createEvent(pastEvent);
      await eventRepository.createEvent(futureEvent);

      const res = await request(global.app)
        .get('/events')
        .query({
          dateFrom: new Date().toISOString(),
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].id).toBe(futureEvent._id);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('dateTo filter', async () => {
      const pastEvent = generateMongoFixture(TEST_EVENT_1, {
        dates: [
          {
            from: new Date(2018, 1, 1),
            to: new Date(2018, 1, 2),
          },
        ],
      });
      const futureEvent = generateMongoFixture(TEST_EVENT_1, {
        dates: [
          {
            from: new Date(2050, 1, 1),
            to: new Date(2050, 1, 2),
          },
        ],
      });
      const ongoingEvent = generateMongoFixture(TEST_EVENT_1, {
        dates: [
          {
            from: new Date(2017, 1, 1),
            to: new Date(2050, 1, 2),
          },
        ],
      });

      await eventRepository.createEvent(pastEvent);
      await eventRepository.createEvent(ongoingEvent);
      await eventRepository.createEvent(futureEvent);

      const res = await request(global.app)
        .get('/events')
        .query({
          dateTo: new Date().toISOString(),
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(2);
      expect(res.body.results.map(event => event.id).sort()).toEqual(
        [pastEvent._id, ongoingEvent._id].sort()
      );
      expect(validateResponse(res)).toBeUndefined();
    });

    it('createdAfter filter', async () => {
      const newEvent = generateMongoFixture(TEST_EVENT_1, {
        createdAt: new Date(2050, 1, 1),
      });
      const oldEvent = generateMongoFixture(TEST_EVENT_1, {
        createdAt: new Date(2018, 1, 1),
      });

      await eventRepository.createEvent(oldEvent);
      await eventRepository.createEvent(newEvent);

      const res = await request(global.app)
        .get('/events')
        .query({
          createdAfter: new Date().toISOString(),
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].id).toEqual(newEvent._id.toString());
      expect(validateResponse(res)).toBeUndefined();
    });

    it('createdBefore filter', async () => {
      const oldEvent = generateMongoFixture(TEST_EVENT_1, {
        createdAt: new Date(2018, 1, 1),
      });
      const newEvent = generateMongoFixture(TEST_EVENT_1, {
        createdAt: new Date(2050, 1, 1),
      });

      await eventRepository.createEvent(oldEvent);
      await eventRepository.createEvent(newEvent);

      const res = await request(global.app)
        .get('/events')
        .query({
          createdBefore: new Date().toISOString(),
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].id).toEqual(oldEvent._id.toString());
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('POST /events', () => {
    const validateResponse = validator.validateResponse('post', '/events');

    it('happy path', async () => {
      const res = await request(global.app)
        .post('/events')
        .send(eventRepository.deserialize(TEST_EVENT_1));
      const body = res.body;

      expect(res.status).toEqual(201);
      expect(body.name).toEqual(TEST_EVENT_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('populates venue location data', async () => {
      const venue1 = await venueRepository.createVenue(TEST_VENUE_1);
      const eventData = update(TEST_FACEBOOK_EVENT_1, {
        organiser: { venue: { $set: venue1._id.toString() } },
      });
      const res = await request(global.app)
        .post('/events')
        .send(eventRepository.deserialize(eventData));
      const body = res.body;

      expect(res.status).toEqual(201);
      expect(body.name).toEqual(TEST_EVENT_1.name);
      expect(body.location).toMatchSnapshot();
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
        dates: update(TEST_EVENT_1.dates, {
          [0]: {
            interestedCount: { $set: 0 },
            ticketsUrl: { $set: 'http://foo.bar' },
            providerEventId: { $set: '1234' },
          },
        }),
        description: {
          en: 'Simple description',
        },
        location: {
          ...TEST_EVENT_1.location,
          address2: '1',
        },
        pageSlug: 'nl/utrecht',
        admin: {
          hide: true,
        },
        videoUrl: 'https://www.youtube.com/watch?v=dTYOkcRH220',
        tickets: {
          checkoutUrl: 'https://nightguide.app',
          provider: 'eventix',
          displayPrice: 10.5,
          providerData: {
            shopId: 'foo',
          },
        },
      });

      const res = await request(global.app)
        .get(`/events/${event1._id}`)
        .send()
        .expect(200);

      expect(res.body).toMatchSnapshot(EVENT_SNAPSHOT_MATCHER);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('ticket products field', async () => {
      const event1 = await eventRepository.createEvent({
        ...TEST_EVENT_1,
        tickets: {
          products: [
            {
              name: 'Test ticket',
              price: 10.12,
            },
          ],
        },
      });

      const res = await request(global.app)
        .get(`/events/${event1._id}`)
        .send()
        .expect(200);

      expect(res.body.tickets.products[0]).toMatchSnapshot(
        EVENT_PRODUCT_MATCHER
      );
      expect(validateResponse(res)).toBeUndefined();
    });

    it('tags fields', async () => {
      const tag1 = await tagRepository.createTag(TEST_TAG_1);
      const event1 = await eventRepository.createEvent({
        ...TEST_EVENT_1,
        tags: [tag1._id.toString()],
      });

      const res = await request(global.app)
        .get(`/events/${event1._id}`)
        .send()
        .expect(200);

      expect(res.body.tags[0].id).toEqual(tag1._id.toString());
      expect(validateResponse(res)).toBeUndefined();
    });

    it('artists fields', async () => {
      const artist1 = await artistRepository.createArtist(TEST_ARTIST_1);
      const event1 = await eventRepository.createEvent(
        update(TEST_EVENT_1, {
          dates: { 0: { artists: { $set: artist1._id.toString() } } },
          artists: { $set: [artist1._id.toString()] },
        })
      );

      const res = await request(global.app)
        .get(`/events/${event1._id}`)
        .send()
        .expect(200);

      expect(res.body.artists[0].id).toEqual(artist1._id.toString());
      expect(res.body.dates[0].artists[0].id).toEqual(artist1._id.toString());
      expect(validateResponse(res)).toBeUndefined();
    });

    it('facebook event fields', async () => {
      const venue1 = await venueRepository.createVenue(TEST_VENUE_1);
      const event1 = await eventRepository.createEvent({
        ..._.set(
          TEST_FACEBOOK_EVENT_1,
          'organiser.venue',
          venue1._id.toString()
        ),
        facebook: {
          ...TEST_FACEBOOK_EVENT_1.facebook,
          title: 'Title',
          description: 'Description',
          interestedCount: 1,
          goingCount: 100,
        },
      });

      const res = await request(global.app)
        .get(`/events/${event1._id}`)
        .send(event1)
        .expect(200);

      const { organiser, ...body } = res.body;
      expect(body).toMatchSnapshot(EVENT_SNAPSHOT_MATCHER);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('filters hidden docs by default', async () => {
      await eventRepository.createEvent({
        ...TEST_EVENT_1,
        admin: {
          hide: true,
        },
      });
      await eventRepository.createEvent(TEST_EVENT_2);

      const res = await request(global.app).get('/events');

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].name).toBe(TEST_EVENT_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('showHidden filter', async () => {
      await eventRepository.createEvent({
        ...TEST_EVENT_1,
        admin: {
          hide: true,
        },
      });
      await eventRepository.createEvent(TEST_EVENT_2);

      const res = await request(global.app)
        .get('/events')
        .query({
          showHidden: true,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(2);
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
          ...eventRepository.deserialize(TEST_EVENT_1),
          title: 'Other title',
        });

      const updatedEvent = await eventRepository.getEvent(event._id);

      expect(res.status).toEqual(200);
      expect(res.body.title).toEqual('Other title');
      expect(updatedEvent.title).toEqual('Other title');
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('DELETE /events/:eventId', () => {
    const validateResponse = validator.validateResponse(
      'delete',
      '/events/{eventId}'
    );

    it('happy path', async () => {
      const event1 = await eventRepository.createEvent(TEST_EVENT_1);

      const res = await request(global.app).delete(`/events/${event1._id}`);

      let event = await eventRepository.getEvent(event1._id);

      expect(event).toBe(null);
      expect(res.status).toEqual(200);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('deletes event images', async () => {
      const event = await eventRepository.createEvent(TEST_EVENT_1);

      sandbox.stub(imagesService, 'upload').resolves();
      sandbox.stub(imagesService, 'getServeableUrl').resolves('foo');
      sandbox.stub(imagesService, 'deleteFile').resolves();
      const image = await eventRepository.uploadEventImage(event._id, {
        buffer: fs.readFileSync(IMAGE_FIXTURE_PATH),
        mime: 'image/jpeg',
      });

      const res = await request(global.app).delete(`/events/${event._id}`);
      const deletedImage = await imageRepository.getImage(image._id);

      expect(deletedImage).toBe(null);
      expect(res.status).toEqual(200);
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('POST /events/:eventId/images', () => {
    const validateResponse = validator.validateResponse(
      'post',
      '/events/{eventId}/images'
    );

    it('happy path - multipart', async () => {
      const event = await eventRepository.createEvent(TEST_EVENT_1);

      sandbox.stub(imagesService, 'upload').resolves();
      sandbox.stub(imagesService, 'getServeableUrl').resolves('testurl');

      const res = await request(global.app)
        .post(`/events/${event.id}/images`)
        .attach('images', IMAGE_FIXTURE_PATH);

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
      sandbox
        .stub(nodeRequest, 'get')
        .resolves(fs.readFileSync(IMAGE_FIXTURE_PATH));

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

  describe('DELETE /events/:eventId/images/:imageId', () => {
    const validateResponse = validator.validateResponse(
      'delete',
      '/events/{eventId}/images/{imageId}'
    );

    it('happy path', async () => {
      const event = await eventRepository.createEvent(TEST_FACEBOOK_EVENT_1);

      sandbox.stub(imagesService, 'upload').resolves();
      sandbox.stub(imagesService, 'getServeableUrl').resolves('foo');
      sandbox.stub(imagesService, 'deleteFile').resolves();
      const image = await eventRepository.uploadEventImage(event._id, {
        buffer: fs.readFileSync(IMAGE_FIXTURE_PATH),
        mime: 'image/jpeg',
      });

      const res = await request(global.app).delete(
        `/events/${event._id.toString()}/images/${image._id}`
      );

      const newEvent = await eventRepository.getEvent(event._id);

      expect(res.status).toEqual(200);
      expect(imagesService.deleteFile.calledWith(image.filename)).toBe(true);
      expect(newEvent.images.length).toEqual(0);
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('GET /events/:fbEventId', () => {
    const validateResponse = validator.validateResponse(
      'get',
      '/events/facebook-events/{fbEventId}'
    );

    it('happy path', async () => {
      const event1 = await eventRepository.createEvent(TEST_FACEBOOK_EVENT_1);

      const res = await request(global.app)
        .get(`/events/facebook-events/${event1.facebook.id}`)
        .send()
        .expect(200);

      expect(res.body).toMatchSnapshot(EVENT_SNAPSHOT_MATCHER);
      expect(res.body.facebook.id).toEqual(TEST_FACEBOOK_EVENT_1.facebook.id);
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('PUT /events/facebook-events/:fbEventId/image', () => {
    const validateResponse = validator.validateResponse(
      'put',
      '/events/facebook-events/{fbEventId}/image'
    );

    it('happy path', async () => {
      const event = await eventRepository.createEvent(TEST_FACEBOOK_EVENT_1);

      sandbox.stub(imagesService, 'upload').resolves();
      sandbox.stub(imagesService, 'getServeableUrl').resolves('testurl');
      sandbox
        .stub(nodeRequest, 'get')
        .resolves(fs.readFileSync(IMAGE_FIXTURE_PATH));

      const res = await request(global.app)
        .put(`/events/facebook-events/${event.facebook.id}/image`)
        .send({
          image: { url: 'http://testurl.com' },
        });

      const newEvent = await eventRepository.getEvent(event._id);

      expect(res.status).toEqual(200);
      expect(newEvent.images.length).toEqual(1);
      expect(newEvent.images[0]).toEqual(res.body.result.id);
      expect(res.body.result.url).toEqual('testurl');
      expect(validateResponse(res)).toBeUndefined();
    });

    it('replaces old images', async () => {
      const event = await eventRepository.createEvent(TEST_FACEBOOK_EVENT_1);

      sandbox.stub(imagesService, 'upload').resolves();
      sandbox.stub(imagesService, 'getServeableUrl').resolves('testurl');
      sandbox.stub(imagesService, 'deleteFile').resolves();
      sandbox
        .stub(nodeRequest, 'get')
        .resolves(fs.readFileSync(IMAGE_FIXTURE_PATH));

      await eventRepository.uploadEventImageByUrl(event._id, {
        url: 'http://existing.com',
        extraData: {
          fbUrl: 'http://existing.com',
        },
      });

      const res = await request(global.app)
        .put(`/events/facebook-events/${event.facebook.id}/image`)
        .send({
          image: { url: 'http://testurl.com' },
        });

      const newEvent = await eventRepository.getEvent(event._id);

      expect(res.status).toEqual(200);
      expect(imagesService.deleteFile.called).toEqual(true);
      expect(res.body.updated).toEqual(true);
      expect(newEvent.images.length).toEqual(1);
      expect(newEvent.images[0]).toEqual(res.body.result.id);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('skips if url hasnt changed', async () => {
      const event = await eventRepository.createEvent(TEST_FACEBOOK_EVENT_1);

      sandbox.stub(imagesService, 'upload').resolves();
      sandbox.stub(imagesService, 'getServeableUrl').resolves('testurl');
      sandbox.stub(imagesService, 'deleteFile').resolves();
      sandbox
        .stub(nodeRequest, 'get')
        .resolves(fs.readFileSync(IMAGE_FIXTURE_PATH));

      await eventRepository.uploadEventImageByUrl(event._id, {
        url: 'foo',
        extraData: {
          fbUrl: 'http://existing.com',
        },
      });

      const res = await request(global.app)
        .put(`/events/facebook-events/${event.facebook.id}/image`)
        .send({
          image: { url: 'http://existing.com' },
        });

      const newEvent = await eventRepository.getEvent(event._id);

      expect(res.status).toEqual(200);
      expect(res.body.skipped).toEqual(true);
      expect(newEvent.images.length).toEqual(1);
      expect(validateResponse(res)).toBeUndefined();
    });
  });
});
