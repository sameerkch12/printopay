import { Schema, model, InferSchemaType } from 'mongoose';

const shopSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    photoUrl: { type: String, trim: true },
    photoPublicId: { type: String, trim: true },
    qrCode: { type: String, required: true, unique: true, trim: true },
    isActive: { type: Boolean, default: false },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    printRates: {
      bwPerPage: { type: Number, min: 0, default: 2 },
      colorPerPage: { type: Number, min: 0, default: 10 },
    },
  },
  { timestamps: true }
);

shopSchema.index({ name: 'text', address: 'text' });
shopSchema.index({ isActive: 1, approvalStatus: 1 });

export type ShopDocument = InferSchemaType<typeof shopSchema>;
export const Shop = model('Shop', shopSchema);
