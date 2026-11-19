const OUTPUT_TYPE = 'image/webp';

interface PrepareImageOptions {
  maxWidth: number;
  maxHeight: number;
  targetBytes: number;
  skipIfBelowBytes?: number;
  initialQuality?: number;
  minQuality?: number;
}

export async function prepareImageForUpload(
  file: File,
  options: PrepareImageOptions
): Promise<File> {
  const {
    maxWidth,
    maxHeight,
    targetBytes,
    skipIfBelowBytes = 700 * 1024,
    initialQuality = 0.82,
    minQuality = 0.64,
  } = options;

  let bitmap: ImageBitmap | null = null;

  try {
    bitmap = await createImageBitmap(file, {
      imageOrientation: 'from-image',
    });

    const sourceWidth = bitmap.width;
    const sourceHeight = bitmap.height;

    const initialScale = Math.min(
      1,
      maxWidth / sourceWidth,
      maxHeight / sourceHeight
    );

    let width = Math.max(
      1,
      Math.round(sourceWidth * initialScale)
    );

    let height = Math.max(
      1,
      Math.round(sourceHeight * initialScale)
    );

    const alreadySmallEnough =
      initialScale === 1 &&
      file.size <= skipIfBelowBytes;

    if (alreadySmallEnough) {
      return file;
    }

    let quality = initialQuality;
    let bestBlob: Blob | null = null;

    for (let attempt = 0; attempt < 7; attempt += 1) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d', {
        alpha: true,
      });

      if (!context) {
        return file;
      }

      context.drawImage(bitmap, 0, 0, width, height);

      const blob = await canvasToBlob(
        canvas,
        OUTPUT_TYPE,
        quality
      );

      if (!blob) {
        return file;
      }

      bestBlob = blob;

      if (blob.size <= targetBytes) {
        break;
      }

      if (quality > minQuality + 0.02) {
        quality = Math.max(
          minQuality,
          quality - 0.07
        );
      } else {
        width = Math.max(
          1,
          Math.round(width * 0.85)
        );

        height = Math.max(
          1,
          Math.round(height * 0.85)
        );
      }
    }

    if (!bestBlob) {
      return file;
    }

    if (
      bestBlob.size >= file.size &&
      file.size <= targetBytes
    ) {
      return file;
    }

    const baseName = file.name.replace(
      /\.[^/.]+$/,
      ''
    );

    return new File(
      [bestBlob],
      `${baseName || 'image'}.webp`,
      {
        type: OUTPUT_TYPE,
        lastModified: Date.now(),
      }
    );
  } catch (error) {
    console.warn(
      'No se pudo optimizar la imagen; se usará el archivo original.',
      error
    );

    return file;
  } finally {
    bitmap?.close();
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      type,
      quality
    );
  });
}
