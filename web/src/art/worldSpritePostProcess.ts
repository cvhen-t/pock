import Phaser from 'phaser';

/** Remove baked-in white / checkerboard backgrounds from AI PNGs. */
export function stripWorldSpriteBackground(scene: Phaser.Scene, textureKey: string): void {
  const texture = scene.textures.get(textureKey);
  const source = texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | null;
  if (!source) return;

  const w = 'naturalWidth' in source ? source.naturalWidth : source.width;
  const h = 'naturalHeight' in source ? source.naturalHeight : source.height;
  if (!w || !h) return;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.drawImage(source, 0, 0);
  const image = ctx.getImageData(0, 0, w, h);
  const data = image.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const neutral = Math.abs(r - g) < 30 && Math.abs(g - b) < 30;
    if (neutral && r > 165 && g > 165 && b > 165) {
      data[i + 3] = 0;
    }
  }

  ctx.putImageData(image, 0, 0);

  if (scene.textures.exists(textureKey)) {
    scene.textures.remove(textureKey);
  }
  scene.textures.addCanvas(textureKey, canvas);
}
