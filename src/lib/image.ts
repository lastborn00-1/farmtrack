export interface NormalizedImage {
  base64: string;
  mimeType: string;
  previewUrl: string;
}

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export async function normalizeImageForAi(file: File): Promise<NormalizedImage> {
  const originalDataUrl = await readAsDataUrl(file);

  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = originalDataUrl;
    await image.decode();

    const maxSize = 1280;
    const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is unavailable');

    ctx.drawImage(image, 0, 0, width, height);
    const previewUrl = canvas.toDataURL('image/jpeg', 0.86);

    return {
      base64: previewUrl.split(',')[1] || '',
      mimeType: 'image/jpeg',
      previewUrl,
    };
  } catch {
    return {
      base64: originalDataUrl.split(',')[1] || '',
      mimeType: file.type || 'image/jpeg',
      previewUrl: originalDataUrl,
    };
  }
}
