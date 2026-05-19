export type PrintColor = 'bw' | 'color';
export type PrintOrientation = 'portrait' | 'landscape';
export type PrintSides = 'single' | 'double';
export type PaperSize = 'A4' | 'A3' | 'Letter' | 'Legal';
export type PrintStatus = 'pending' | 'processing' | 'printing' | 'completed' | 'failed' | 'expired';

export interface PrintSettings {
  color: PrintColor;
  copies: number;
  pageRange: string;
  orientation: PrintOrientation;
  sides: PrintSides;
  paperSize: PaperSize;
}
