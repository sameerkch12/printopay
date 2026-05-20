import { Schema, model, InferSchemaType } from 'mongoose';

const errorLogSchema = new Schema(
  {
    source: {
      type: String,
      enum: ['backend', 'customer_app', 'shop_dashboard'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'error', 'fatal'],
      default: 'error',
    },
    message: { type: String, required: true, trim: true },
    stack: { type: String },
    path: { type: String, trim: true },
    method: { type: String, trim: true },
    statusCode: { type: Number },
    userAgent: { type: String },
    ip: { type: String },
    userId: { type: String, trim: true },
    userName: { type: String, trim: true },
    userEmail: { type: String, trim: true },
    userRole: { type: String, trim: true },
    shopId: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

errorLogSchema.index({ source: 1, createdAt: -1 });
errorLogSchema.index({ userId: 1, createdAt: -1 });
errorLogSchema.index({ severity: 1, createdAt: -1 });

export type ErrorLogDocument = InferSchemaType<typeof errorLogSchema>;
export const ErrorLog = model('ErrorLog', errorLogSchema);
