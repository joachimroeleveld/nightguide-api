const request = require('request-promise');
const { Storage } = require('@google-cloud/storage');

const config = require('../config');

const BASE_URL = config.get('IMAGES_SERVICE_URL');
const TOKEN = config.get('IMAGES_TOKEN');

const storage = new Storage({
  projectId: config.get('GCP_PROJECT_ID'),
});
const bucket = storage.bucket(config.get('BUCKET_IMAGES'));

async function upload(name, buffer) {
  await bucket.file(name).save(buffer);
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
};
