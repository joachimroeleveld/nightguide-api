const imgSize = require('image-size');
const mimeTypes = require('mime-types');
const request = require('request');
const _ = require('lodash');

const {
  InvalidArgumentError,
} = require('../../shared/errors/InvalidArgumentError');
const imagesService = require('../../shared/services/images');
const Image = require('./imageModel.js');
const { deserializeImage } = require('./lib/serialization');

async function getImage(conditions, opts = {}) {
  let where = conditions;
  if (_.isString(conditions)) {
    where = { _id: conditions };
  }

  return await Image.findOne(where).exec();
}

async function uploadImage({ buffer, mime, extraData }) {
  if (!imagesService.SUPPORTED_MIME_TYPES.includes(mime)) {
    throw new InvalidArgumentError('invalid_mime');
  }

  const image = new Image({
    filesize: buffer.byteLength,
    filetype: mime,
    extraData,
  });

  image.filename = `${image._id}.${mimeTypes.extension(mime)}`;

  try {
    await imagesService.upload(image.filename, mime, buffer);

    const dimensions = imgSize(buffer);

    image.url = await imagesService.getServeableUrl(image.filename);
    image.width = dimensions.width;
    image.height = dimensions.height;

    await image.save();

    return image;
  } catch (e) {
    console.error('Upload error: ', e);
    throw new Error('upload_failed');
  }
}

async function uploadImageByUrl(image) {
  const { url, extraData } = image;

  const res = await request.get({
    uri: url,
    resolveWithFullResponse: true,
    encoding: null,
  });
  const mime = res.headers['content-type'];

  return await uploadImage({
    buffer: res.body,
    mime,
    extraData,
  });
}

async function deleteImageById(imageId) {
  const image = await Image.findById(imageId).exec();

  if (!image) {
    return null;
  }

  await imagesService.deleteFile(image.filename);

  await Image.findByIdAndRemove(imageId).exec();
}

module.exports = {
  getImage,
  uploadImage,
  uploadImageByUrl,
  deleteImageById,
  deserializeImage,
};
