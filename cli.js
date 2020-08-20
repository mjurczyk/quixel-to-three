#!/usr/bin/env node

const Jimp = require('jimp');
const fs = require('fs-extra');

const QuixelMapping = {
  't3roughness': [ 'Roughness', 'roughness' ],
  't3ao': [ 'AO', 'ao', 'ambient_occlusion', 'Ambient_Occlusion' ],
  't3metalness': [ 'Metalness', 'metalness', 'metallic' ],
  't3normal': [ 'Normal', 'normal' ],
  't3map': [ 'Albedo', 'albedo', 'color', 'base_color', 'Base_Color' ],
  't3displacement': [ 'Displacement', 'displacement', 'height', 'Height' ]
};
const DefaultOutputWidth = 1024;
const DefaultOutputFiletype = 'jpg';
const SupportedFiletypesRegExp = new RegExp([
  'jpeg',
  'jpg',
  'png',
  'bmp',
  'tiff',
  'tif',
  'gif'
].join('|', 'gmi'));

const [ _, __, arg1, arg2 ] = process.argv;

if (!arg1 && !arg2) {
  console.info('quixel-to-three [path/to/any/quixel/asset.jpg] [output-resolution=1024]')
  return;
}

let pathBase;
const isPathValid = arg1 && Object.keys(QuixelMapping).reduce((valid, next) => {
  const split = `${arg1}`.split(new RegExp(QuixelMapping[next].join('|')));

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

console.info('Searching ...');

return Promise.all(
  Object.keys(QuixelMapping).map((id) => {
    availableAssets[id] = QuixelMapping[id].some(path => {
      const filepath = pathBase.join(path);
      const exists = fs.pathExistsSync(filepath);

      if (exists) {
        QuixelMapping[id] = path;

        console.info([
          `Asset: ${filepath}`,
          `Type: ${path}`
        ].join(' '));

        return true;
      }

      return false;
    });

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
      console.info('Converting albedo ...');

      const result = image.resize(outputWidth, Jimp.AUTO, Jimp.RESIZE_NEAREST_NEIGHBOR)
        .write(pathBase.join('t3map').replace(SupportedFiletypesRegExp, DefaultOutputFiletype));
    });
  }

  const aoPromise = new Promise(resolve => {
    if (availableAssets.t3ao) {
      console.info('Converting ambient occlusion ...');

      Jimp.read(pathBase.join(QuixelMapping.t3ao)).then(image => {
        resolve(image.resize(outputWidth, Jimp.AUTO, Jimp.RESIZE_NEAREST_NEIGHBOR));
      });
    } else {
      resolve(new Jimp(outputWidth, outputWidth * outputAspectRatio, 0xffffffff));
    }
  });

  const roughnessPromise = new Promise(resolve => {
    if (availableAssets.t3roughness) {
      console.info('Converting roughness ...');

      Jimp.read(pathBase.join(QuixelMapping.t3roughness)).then(image => {
        resolve(image.resize(outputWidth, Jimp.AUTO, Jimp.RESIZE_NEAREST_NEIGHBOR));
      });
    } else {
      resolve(new Jimp(outputWidth, outputWidth * outputAspectRatio, 0xffffffff));
    }
  });

  const metalnessPromise = new Promise(resolve => {
    if (availableAssets.t3metalness) {
      console.info('Converting metalness ...');

      Jimp.read(pathBase.join(QuixelMapping.t3metalness)).then(image => {
        resolve(image.resize(outputWidth, Jimp.AUTO, Jimp.RESIZE_NEAREST_NEIGHBOR));
      });
    } else {
      resolve(new Jimp(outputWidth, outputWidth * outputAspectRatio, 0x000000ff));
    }
  });

  if (availableAssets.t3normal) {
    console.info('Converting normals ...');

    Jimp.read(pathBase.join(QuixelMapping.t3normal)).then(image => {
      const result = image.resize(outputWidth, Jimp.AUTO, Jimp.RESIZE_NEAREST_NEIGHBOR)
        .write(pathBase.join('t3normal').replace(SupportedFiletypesRegExp, DefaultOutputFiletype));
    });
  }

  if (availableAssets.t3displacement) {
    console.info('Converting displacements ...');

    Jimp.read(pathBase.join(QuixelMapping.t3displacement)).then(image => {
      const result = image.resize(outputWidth, Jimp.AUTO, Jimp.RESIZE_NEAREST_NEIGHBOR)
        .write(pathBase.join('t3displacement').replace(SupportedFiletypesRegExp, DefaultOutputFiletype));
    });
  }

  return Promise.all([
    aoPromise,
    roughnessPromise,
    metalnessPromise,
  ]).then(([ ao, roughness, metalness ]) => {
    const pbrMap = new Jimp(outputWidth, outputWidth * outputAspectRatio, 0xffffff);

    console.info('Converting PBR ...');

    pbrMap.scan(0, 0, pbrMap.bitmap.width, pbrMap.bitmap.height, function (x, y, index) {
      this.bitmap.data[index + 0] = ao.bitmap.data[index + 0];
      this.bitmap.data[index + 1] = roughness.bitmap.data[index + 1]
      this.bitmap.data[index + 2] = metalness.bitmap.data[index + 2]
    })
    .write(pathBase.join('t3pbr').replace(SupportedFiletypesRegExp, DefaultOutputFiletype));
  });
})
.catch((error) => {
  console.error('Error occured. Make sure asset file exists.');
  console.error('If possible, use assets in 2K and 4K resolution to avoid memory overflow.');
});
