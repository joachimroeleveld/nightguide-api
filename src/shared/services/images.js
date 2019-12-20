const request = require('request-promise-native');

const config = require('../config');
const storage = require('../services/storage');

const SUPPORTED_MIME_TYPES = [
  'image/png',
  'image/jpg',
  'image/jpeg',
  'image/gif',
];
const BASE_URL = config.get('IMAGES_SERVICE_URL');
const TOKEN = config.get('IMAGES_SERVICE_TOKEN');
const BUCKET = config.get('BUCKET_IMAGES');

async function upload(name, type, buffer) {
  await storage
    .bucket(BUCKET)
    .file(name)
    .save(buffer, {
      metadata: {
        contentType: type,
      },
    });
}

async function deleteFile(name) {
  await storage
    .bucket(BUCKET)
    .file(name)
    .delete();
}

async function getServeableUrl(fileName) {
  const result = await request({
    baseUrl: BASE_URL,
    uri: `/serving-url/${fileName}`,
    qs: {
      key: TOKEN,
    },
    json: true,
  });

  return result.url;
}

module.exports = {
  upload,
  deleteFile,
  getServeableUrl,
  SUPPORTED_MIME_TYPES,
};
