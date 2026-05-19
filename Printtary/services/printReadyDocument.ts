import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { PaperSize, PrintSettings, UploadedFile } from '@/types';

type PageSpec = {
  width: number;
  height: number;
};

const PAGE_SIZES: Record<PaperSize, PageSpec> = {
  A4: { width: 595, height: 842 },
  A3: { width: 842, height: 1191 },
  Letter: { width: 612, height: 792 },
  Legal: { width: 612, height: 1008 },
};

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function extensionFromMime(mimeType: string) {
  const map: Record<string, string> = {
    'image/jpeg': 'jpeg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
  };

  return map[mimeType] ?? 'jpeg';
}

function printReadyName(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^.]+$/, '');
  return `${withoutExtension || 'document'}-print-ready.pdf`;
}

function pageSizeFor(settings: PrintSettings) {
  const base = PAGE_SIZES[settings.paperSize] ?? PAGE_SIZES.A4;
  return settings.orientation === 'landscape'
    ? { width: base.height, height: base.width }
    : base;
}

function shouldIncludeImagePage(pageRange: string) {
  if (!pageRange || pageRange === 'All') return true;

  return pageRange.split(',').some((part) => {
    const trimmed = part.trim();
    if (!trimmed) return false;

    if (trimmed.includes('-')) {
      const [from, to] = trimmed.split('-').map((value) => Number.parseInt(value.trim(), 10));
      if (!Number.isFinite(from) || !Number.isFinite(to)) return false;
      return Math.min(from, to) <= 1 && Math.max(from, to) >= 1;
    }

    return Number.parseInt(trimmed, 10) === 1;
  });
}

async function getFileSize(uri: string) {
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists && !info.isDirectory && typeof info.size === 'number' ? info.size : 0;
}

async function imageToPrintReadyPdf(file: UploadedFile, settings: PrintSettings): Promise<UploadedFile> {
  const imageBase64 = await FileSystem.readAsStringAsync(file.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const imageType = file.type || `image/${extensionFromMime(file.type)}`;
  const dataUri = `data:${imageType};base64,${imageBase64}`;
  const page = pageSizeFor(settings);
  const pageCount = shouldIncludeImagePage(settings.pageRange) ? Math.max(1, settings.copies) : 1;
  const filter = settings.color === 'bw' ? 'filter: grayscale(1) contrast(1.08);' : '';
  const pages = Array.from({ length: pageCount }, () => `
    <section class="page">
      <img src="${dataUri}" alt="${escapeHtml(file.name)}" />
    </section>
  `).join('');

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page { size: ${page.width}pt ${page.height}pt; margin: 0; }
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; background: #fff; }
          .page {
            width: ${page.width}pt;
            height: ${page.height}pt;
            display: flex;
            align-items: center;
            justify-content: center;
            page-break-after: always;
            background: #fff;
            overflow: hidden;
          }
          .page:last-child { page-break-after: auto; }
          img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            ${filter}
          }
        </style>
      </head>
      <body>${pages}</body>
    </html>
  `;

  const result = await Print.printToFileAsync({
    html,
    width: page.width,
    height: page.height,
    margins: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  return {
    ...file,
    name: printReadyName(file.name),
    type: 'application/pdf',
    uri: result.uri,
    size: await getFileSize(result.uri),
    pages: pageCount,
  };
}

function ascii(value: string) {
  return new TextEncoder().encode(value);
}

function concatBytes(parts: Uint8Array[]) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;

  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });

  return output;
}

function binaryStringToBytes(value: string) {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index) & 0xff;
  }
  return bytes;
}

function dataUrlToBytes(dataUrl: string) {
  const base64 = dataUrl.split(',')[1] ?? '';
  return binaryStringToBytes(window.atob(base64));
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read generated image'));
    reader.readAsDataURL(blob);
  });
}

function loadWebImage(uri: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not load image for print preparation'));
    image.src = uri;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error('Could not prepare image for printing'));
    }, type, quality);
  });
}

function drawImageContain(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number
) {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const x = (width - drawWidth) / 2;
  const y = (height - drawHeight) / 2;
  context.drawImage(image, x, y, drawWidth, drawHeight);
}

function applyGrayscale(context: CanvasRenderingContext2D, width: number, height: number) {
  const imageData = context.getImageData(0, 0, width, height);
  const { data } = imageData;

  for (let index = 0; index < data.length; index += 4) {
    const gray = Math.round(data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114);
    data[index] = gray;
    data[index + 1] = gray;
    data[index + 2] = gray;
  }

  context.putImageData(imageData, 0, 0);
}

function buildImagePdf(jpegBytes: Uint8Array[], page: PageSpec, imagePixelSize: PageSpec) {
  const parts: Uint8Array[] = [ascii('%PDF-1.4\n')];
  const offsets: number[] = [];

  const addObject = (id: number, body: Uint8Array[]) => {
    offsets[id] = parts.reduce((sum, part) => sum + part.length, 0);
    parts.push(ascii(`${id} 0 obj\n`), ...body, ascii('\nendobj\n'));
  };

  const pageCount = jpegBytes.length;
  const catalogId = 1;
  const pagesId = 2;
  const firstPageId = 3;
  const imageStartId = firstPageId + pageCount;
  const contentStartId = imageStartId + pageCount;
  const pageIds = Array.from({ length: pageCount }, (_, index) => firstPageId + index);

  addObject(catalogId, [ascii(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`)]);
  addObject(pagesId, [ascii(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageCount} >>`)]);

  jpegBytes.forEach((imageBytes, index) => {
    const imageId = imageStartId + index;
    const contentId = contentStartId + index;
    const pageId = firstPageId + index;
    const content = `q ${page.width} 0 0 ${page.height} 0 0 cm /Im${index} Do Q`;
    addObject(pageId, [
      ascii(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${page.width} ${page.height}] /Resources << /XObject << /Im${index} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`),
    ]);
    addObject(imageId, [
      ascii(`<< /Type /XObject /Subtype /Image /Width ${imagePixelSize.width} /Height ${imagePixelSize.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`),
      imageBytes,
      ascii('\nendstream'),
    ]);
    addObject(contentId, [
      ascii(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`),
    ]);
  });

  const xrefOffset = parts.reduce((sum, part) => sum + part.length, 0);
  const objectCount = contentStartId + pageCount - 1;
  const xref = [
    'xref',
    `0 ${objectCount + 1}`,
    '0000000000 65535 f ',
    ...Array.from({ length: objectCount }, (_, index) => `${String(offsets[index + 1]).padStart(10, '0')} 00000 n `),
    'trailer',
    `<< /Size ${objectCount + 1} /Root ${catalogId} 0 R >>`,
    'startxref',
    String(xrefOffset),
    '%%EOF',
    '',
  ].join('\n');

  parts.push(ascii(xref));
  return concatBytes(parts);
}

async function webImageToPrintReadyPdf(file: UploadedFile, settings: PrintSettings): Promise<UploadedFile> {
  const image = await loadWebImage(file.uri);
  const page = pageSizeFor(settings);
  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(page.width * scale);
  canvas.height = Math.round(page.height * scale);

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not prepare image for printing');
  }

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawImageContain(context, image, canvas.width, canvas.height);
  if (settings.color === 'bw') {
    applyGrayscale(context, canvas.width, canvas.height);
  }

  const jpegBlob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
  const jpegBytes = dataUrlToBytes(await blobToDataUrl(jpegBlob));
  const pageCount = shouldIncludeImagePage(settings.pageRange) ? Math.max(1, settings.copies) : 1;
  const pdfBytes = buildImagePdf(
    Array.from({ length: pageCount }, () => jpegBytes),
    page,
    { width: canvas.width, height: canvas.height }
  );
  const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

  return {
    ...file,
    name: printReadyName(file.name),
    type: 'application/pdf',
    uri: URL.createObjectURL(pdfBlob),
    size: pdfBlob.size,
    pages: pageCount,
  };
}

export async function preparePrintReadyDocument(file: UploadedFile, settings: PrintSettings) {
  if (Platform.OS === 'web') {
    if (file.type.startsWith('image/')) {
      return webImageToPrintReadyPdf(file, settings);
    }

    return file;
  }

  if (file.type.startsWith('image/')) {
    return imageToPrintReadyPdf(file, settings);
  }

  return file;
}
