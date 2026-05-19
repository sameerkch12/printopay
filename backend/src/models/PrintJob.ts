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

const printJobSchema = new Schema(
  {
    jobNumber: { type: String, required: true, unique: true },
    document: { type: Types.ObjectId, ref: 'DocumentAsset', required: true },
    shop: { type: Types.ObjectId, ref: 'Shop', required: true },
    userId: { type: String, trim: true },
    settings: { type: printSettingsSchema, required: true },
    otpHash: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'printing', 'completed', 'failed', 'expired'] satisfies PrintStatus[],
      default: 'pending',
    },
    estimatedPages: { type: Number, required: true, min: 1 },
    statusHistory: { type: [statusHistorySchema], default: [] },
  },
  { timestamps: true }
);

printJobSchema.index({ userId: 1, createdAt: -1 });
printJobSchema.index({ shop: 1, status: 1 });
printJobSchema.index({ otpExpiresAt: 1 });

export type PrintJobDocument = InferSchemaType<typeof printJobSchema>;
export const PrintJob = model('PrintJob', printJobSchema);
