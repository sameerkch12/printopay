import { Schema, model, InferSchemaType } from 'mongoose';

const documentAssetSchema = new Schema(
  {
    originalName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true, min: 1 },
    publicId: { type: String, required: true, unique: true },
    cloudinaryAssetId: { type: String, required: true },
    secureUrl: { type: String, required: true },
    resourceType: { type: String, required: true, default: 'raw' },
    format: { type: String, required: true, default: 'pdf' },
    uploadedBy: { type: String, trim: true },
    expiresAt: { type: Date, required: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

documentAssetSchema.index({ uploadedBy: 1, createdAt: -1 });
documentAssetSchema.index({ expiresAt: 1 });

export type DocumentAssetDocument = InferSchemaType<typeof documentAssetSchema>;
export const DocumentAsset = model('DocumentAsset', documentAssetSchema);
