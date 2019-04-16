const request = require('request-promise-native');
const { Storage } = require('@google-cloud/storage');

const config = require('../config');

const SUPPORTED_MIME_TYPES = ['image/png', 'image/jpg', 'image/jpeg'];
const BASE_URL = config.get('IMAGES_SERVICE_URL');
const TOKEN = config.get('IMAGES_SERVICE_TOKEN');

const storage = new Storage({
  projectId: config.get('GCP_PROJECT_ID'),
});
const bucket = storage.bucket(config.get('BUCKET_IMAGES'));

async function upload(name, type, buffer) {
  await bucket.file(name).save(buffer, {
    metadata: {
      contentType: type,
    },
  });
}

async function getServeableUrl(fileName) {
  const result = await request({
    baseUrl: BASE_URL,
    uri: `/images/get-url/${fileName}`,
    qs: {
      key: TOKEN,
    },
    json: true,
  });

  return result.url;
}

module.exports = {
  upload,
  getServeableUrl,
  SUPPORTED_MIME_TYPES,
};
