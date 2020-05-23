#!/usr/bin/env node

const Jimp = require('jimp');
const fs = require('fs-extra');

const QuixelMapping = {
  't3roughness': 'Roughness',
  't3ao': 'AO',
  't3metalness': 'Metalness',
  't3normal': 'Normal',
  't3map': 'Albedo',
  't3displacement': 'Displacement'
};
const DefaultOutputWidth = 1024;

const [ _, __, arg1, arg2 ] = process.argv;

if (!arg1 && !arg2) {
  console.info('quixel-to-three [path/to/any/quixel/asset.jpg] [output-resolution=1024]')
  return;
}

let pathBase;
const isPathValid = arg1 && Object.keys(QuixelMapping).reduce((valid, next) => {
  const split = `${arg1}`.split(QuixelMapping[next]);

  if (split.length === 2) {
    pathBase = split;

    return true;
  }

  return valid;
}, false);

if (!isPathValid) {
  console.warn('Invalid path, link one of Quixel assets (Albedo, AO, Roughness, Metalness, Normal etc.)');
  return;
}

const outputWidth = !isNaN(parseInt(arg2, 10)) ? parseInt(arg2, 10) : DefaultOutputWidth;
let outputAspectRatio;
const availableAssets = {};

return Promise.all(
  Object.keys(QuixelMapping).map((id) => {
    availableAssets[id] = fs.pathExistsSync(pathBase.join(QuixelMapping[id]));

    if (availableAssets[id] && !outputAspectRatio) {
      return new Promise((resolve) => {
        const sample = Jimp.read(pathBase.join(QuixelMapping[id]))
        .then(image => {
          const result = image.resize(outputWidth, Jimp.AUTO, Jimp.RESIZE_NEAREST_NEIGHBOR);
    
          const aspectRatio = result.bitmap ? (result.bitmap.height / outputWidth) : 1.0;
          outputAspectRatio = isNaN(aspectRatio) ? 1.0 : aspectRatio;
    
          resolve();
        });
      });
    }

    return Promise.resolve();
  })
).then(() => {
  let outputColorMap;
  let outputNormalMap;
  let outputPBRMap;

  if (availableAssets.t3map) {
    Jimp.read(pathBase.join(QuixelMapping.t3map)).then(image => {
      const result = image.resize(outputWidth, Jimp.AUTO, Jimp.RESIZE_NEAREST_NEIGHBOR)
        .write(pathBase.join('t3map'));
    });
  }

  const aoPromise = new Promise(resolve => {
    if (availableAssets.t3ao) {
      Jimp.read(pathBase.join(QuixelMapping.t3ao)).then(image => {
        resolve(image.resize(outputWidth, Jimp.AUTO, Jimp.RESIZE_NEAREST_NEIGHBOR));
      });
    } else {
      resolve(new Jimp(outputWidth, outputWidth * outputAspectRatio, 0xffffffff));
    }
  });

  const roughnessPromise = new Promise(resolve => {
    if (availableAssets.t3roughness) {
      Jimp.read(pathBase.join(QuixelMapping.t3roughness)).then(image => {
        resolve(image.resize(outputWidth, Jimp.AUTO, Jimp.RESIZE_NEAREST_NEIGHBOR));
      });
    } else {
      resolve(new Jimp(outputWidth, outputWidth * outputAspectRatio, 0xffffffff));
    }
  });

  const metalnessPromise = new Promise(resolve => {
    if (availableAssets.t3metalness) {
      Jimp.read(pathBase.join(QuixelMapping.t3metalness)).then(image => {
        resolve(image.resize(outputWidth, Jimp.AUTO, Jimp.RESIZE_NEAREST_NEIGHBOR));
      });
    } else {
      resolve(new Jimp(outputWidth, outputWidth * outputAspectRatio, 0x000000ff));
    }
  });

  if (availableAssets.t3normal) {
    Jimp.read(pathBase.join(QuixelMapping.t3normal)).then(image => {
      const result = image.resize(outputWidth, Jimp.AUTO, Jimp.RESIZE_NEAREST_NEIGHBOR)
        .write(pathBase.join('t3normal'));
    });
  }

  if (availableAssets.t3displacement) {
    Jimp.read(pathBase.join(QuixelMapping.t3displacement)).then(image => {
      const result = image.resize(outputWidth, Jimp.AUTO, Jimp.RESIZE_NEAREST_NEIGHBOR)
        .write(pathBase.join('t3displacement'));
    });
  }

  return Promise.all([
    aoPromise,
    roughnessPromise,
    metalnessPromise,
  ]).then(([ ao, roughness, metalness ]) => {
    const pbrMap = new Jimp(outputWidth, outputWidth * outputAspectRatio, 0xffffff);

    pbrMap.scan(0, 0, pbrMap.bitmap.width, pbrMap.bitmap.height, function (x, y, index) {
      this.bitmap.data[index + 0] = ao.bitmap.data[index + 0];
      this.bitmap.data[index + 1] = roughness.bitmap.data[index + 1]
      this.bitmap.data[index + 2] = metalness.bitmap.data[index + 2]
    })
    .write(pathBase.join('t3pbr'));
  });
})
.catch((error) => {
  console.error('Error occured. Make sure asset file exists.');
  console.error('If possible, use assets in 2K and 4K resolution to avoid memory overflow.');
});
