async function streamToBuffer(stream) {
  return new Promise(function(resolve, reject) {
    const buffers = [];
    stream.on('data', data => {
      buffers.push(data);
    });
    stream.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
    stream.on('error', reject);
  });
}

module.exports = {
  streamToBuffer,
};
