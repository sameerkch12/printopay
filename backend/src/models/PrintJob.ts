import { Schema, model, Types, InferSchemaType } from 'mongoose';
import { PaperSize, PrintColor, PrintOrientation, PrintSides, PrintStatus } from '../types/print';

const printSettingsSchema = new Schema(
  {
    color: { type: String, enum: ['bw', 'color'] satisfies PrintColor[], required: true },
    copies: { type: Number, min: 1, max: 50, required: true },
    pageRange: { type: String, required: true, default: 'All' },
    orientation: { type: String, enum: ['portrait', 'landscape'] satisfies PrintOrientation[], required: true },
    sides: { type: String, enum: ['single', 'double'] satisfies PrintSides[], required: true },
    paperSize: { type: String, enum: ['A4', 'A3', 'Letter', 'Legal'] satisfies PaperSize[], required: true },
  },
  { _id: false }
);

const statusHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'processing', 'printing', 'completed', 'failed', 'expired'] satisfies PrintStatus[],
      required: true,
    },
    message: { type: String, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const documentPrintSettingsSchema = new Schema(
  {
    document: { type: Types.ObjectId, ref: 'DocumentAsset', required: true },
    fileName: { type: String, trim: true },
    pages: { type: Number, min: 1 },
    chargeablePages: { type: Number, min: 1 },
    estimatedPrice: { type: Number, min: 0 },
    settings: { type: printSettingsSchema, required: true },
  },
  { _id: false }
);

const printJobSchema = new Schema(
  {
    jobNumber: { type: String, required: true, unique: true },
    document: { type: Types.ObjectId, ref: 'DocumentAsset' },
    documents: {
      type: [{ type: Types.ObjectId, ref: 'DocumentAsset' }],
      default: [],
      validate: {
        validator: (value: Types.ObjectId[]) => value.length <= 10,
        message: 'A print job can have at most 10 documents',
      },
    },
    shop: { type: Types.ObjectId, ref: 'Shop', required: true },
    userId: { type: String, trim: true },
    settings: { type: printSettingsSchema, required: true },
    documentSettings: {
      type: [documentPrintSettingsSchema],
      default: [],
      validate: {
        validator: (value: unknown[]) => value.length <= 10,
        message: 'A print job can have at most 10 document settings',
      },
    },
    usedDefaultSettings: { type: Boolean, default: false },
    otpHash: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'printing', 'completed', 'failed', 'expired'] satisfies PrintStatus[],
      default: 'pending',
    },
    estimatedPages: { type: Number, required: true, min: 1 },
    estimatedPrice: { type: Number, min: 0 },
    statusHistory: { type: [statusHistorySchema], default: [] },
  },
  { timestamps: true }
);

printJobSchema.index({ userId: 1, createdAt: -1 });
printJobSchema.index({ shop: 1, status: 1 });
printJobSchema.index({ otpExpiresAt: 1 });

export type PrintJobDocument = InferSchemaType<typeof printJobSchema>;
export const PrintJob = model('PrintJob', printJobSchema);
