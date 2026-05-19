import { Schema, model, Types, InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['shop_owner', 'admin'], required: true },
    shop: { type: Types.ObjectId, ref: 'Shop' },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, createdAt: -1 });

export type UserDocument = InferSchemaType<typeof userSchema>;
export const User = model('User', userSchema);
