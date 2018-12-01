const request = require('request-promise');
const { Storage } = require('@google-cloud/storage');

const BASE_URL = process.env.IMAGES_SERVICE_URL;
const TOKEN = process.env.IMAGES_SERVICE_TOKEN;

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
});
const bucket = storage.bucket(process.env.BUCKET_IMAGES);

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
