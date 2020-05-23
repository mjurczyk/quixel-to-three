# Convert Quixel assets into Three.js compatible PBR materials

![ezgif-1-5868c0f73076](https://user-images.githubusercontent.com/9549760/82736537-c0f9b900-9d2a-11ea-8682-e54bf37b7798.gif)

## Usage

```bash
npm install quixel-to-three
quixel-to-three /absolute/path/to/any/quixel/asset_2K_Albedo.jpg
```

Command converts a collection of Quixel assets (albedo, normals, roughness, etc.) into a corresponding Three.js PBR maps (use with [MeshStandardMaterial](https://threejs.org/docs/index.html#api/en/materials/MeshStandardMaterial).)

### Output

Output files are placed next to the original assets with an appended `t3` prefix.

### Output size

You can limit output size by defining the output width.

```bash
quixel-to-three /Files/Quixel/test_4K_Normal.jpg 512
```

Output textures preserve aspect ratio of the original assets.

## Limitations

Node processes have memory limits that are easily exceeded when trying to convert 5 x 8K textures. ***To save time and prevent memory errors, use with 2K or 4K Quixel textures.***

![ezgif-1-b594713bff95](https://user-images.githubusercontent.com/9549760/82736539-c35c1300-9d2a-11ea-914b-825c0c8a7ccb.gif)
