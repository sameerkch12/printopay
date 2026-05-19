import QRCode from 'qrcode';

const QR_OPTIONS = {
  errorCorrectionLevel: 'M' as const,
  margin: 4,
  color: {
    dark: '#0f172a',
    light: '#ffffff',
  },
};

export function createQrSvg(text: string) {
  const qr = QRCode.create(text, QR_OPTIONS);
  const quietZone = QR_OPTIONS.margin;
  const size = qr.modules.size;
  const viewBoxSize = size + quietZone * 2;
  const cells: string[] = [];

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (qr.modules.get(row, col)) {
        cells.push(`<rect x="${col + quietZone}" y="${row + quietZone}" width="1" height="1"/>`);
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" shape-rendering="crispEdges"><rect width="${viewBoxSize}" height="${viewBoxSize}" fill="${QR_OPTIONS.color.light}"/><g fill="${QR_OPTIONS.color.dark}">${cells.join('')}</g></svg>`;
}

export function QrCodeSvg({ value, className }: { value: string; className?: string }) {
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: createQrSvg(value) }}
    />
  );
}
