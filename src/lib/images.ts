// Largest width displayed in the app (product detail, 2x screens): no need to store more pixels
const MAX_WIDTH = 1200
const QUALITY = 0.8

function encode(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY))
}

// Resizes a photo in the browser and re-encodes it as WebP before upload (eco: a 3-4 MB phone photo
// becomes ~100-200 KB, stored once and downloaded by every visitor).
// Browsers that cannot encode WebP return a PNG instead: JPEG is used then.
export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_WIDTH / bitmap.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const webp = await encode(canvas, 'image/webp')
  if (webp?.type === 'image/webp') return webp
  const jpeg = await encode(canvas, 'image/jpeg')
  if (!jpeg) throw new Error('Image illisible : choisissez un fichier JPEG, PNG ou WebP.')
  return jpeg
}
