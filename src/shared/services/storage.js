const { Storage } = require('@google-cloud/storage');

const config = require('../../shared/config');

const storage = new Storage({
  projectId: config.get('GCP_PROJECT_ID'),
});

function bucket(bucketName) {
  return storage.bucket(bucketName);
}

module.exports = {
  bucket,
};
