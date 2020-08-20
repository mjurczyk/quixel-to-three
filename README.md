<div style="text-align: center;">
<img src="https://user-images.githubusercontent.com/9549760/90776740-c8653a00-e2fa-11ea-963a-768b3c35a039.png" />
</div>

Convert Quixel assets into Three.js compatible PBR materials.

## Usage

```bash
npm install quixel-to-three
quixel-to-three /absolute/path/to/any/quixel/asset_2K_Albedo.jpg
```

Command converts a collection of Quixel assets (albedo, normals, roughness, etc.) into a corresponding Three.js PBR maps (use with [MeshStandardMaterial](https://threejs.org/docs/index.html#api/en/materials/MeshStandardMaterial).)

![ezgif-1-5868c0f73076](https://user-images.githubusercontent.com/9549760/82736537-c0f9b900-9d2a-11ea-8682-e54bf37b7798.gif)

#### Output

Output files are placed next to the original assets with an appended `t3` prefix.

#### Usage with Three.js

Converted assets can be plugged directly into Three.js PBR materials:

```js
const mesh = new THREE.Mesh(
    new THREE.IcosahedronBufferGeometry(2, 5),
    new THREE.MeshStandardMaterial({
        map: './assets/texture_2K_t3map.png',                       // Use t3map for map
        normalMap: './assets/texture_2K_t3normal.png',              // Use t3normal for normalMap
        aoMap: './assets/texture_2K_t3pbr.png',                     // Use t3pbr for aoMap
        metalnessMap: './assets/texture_2K_t3pbr.png',              // Use t3pbr for metalnessMap
        roughnessMap: './assets/texture_2K_t3pbr.png',              // Use t3pbr for roughnessMap
        displacementMap: './assets/texture_2K_t3displacement.png'   // Use t3displacement for displacementMap
    })
);
```

See PBR example [here](https://codepen.io/mjurczyk/pen/yLeMxWx).

#### Missing files

Some materials contain all texture maps - albedo, normals, roughness etc. Some skip the maps that are unnecessary. For example, if original assets do not contain a displacement map `t3displacement` will not be created.

For PBR texture maps, if some are not present, default Three.js values are used instead (see [docs](https://threejs.org/docs/index.html#api/en/materials/MeshStandardMaterial) for more details).

### Output size

You can limit output size by defining the output width.

```bash
quixel-to-three /Files/Quixel/test_4K_Normal.jpg 512
```

Output textures preserve aspect ratio of the original assets.

## Limitations

Node processes have memory limits that are easily exceeded when trying to convert 5 x 8K textures. ***To save time and prevent memory errors, use with 2K or 4K Quixel textures.***

![ezgif-1-b594713bff95](https://user-images.githubusercontent.com/9549760/82736539-c35c1300-9d2a-11ea-914b-825c0c8a7ccb.gif)
