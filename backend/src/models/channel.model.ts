import mongoose, { Document, Schema } from 'mongoose';

export interface IChannel extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  handle: string; // unique @handle
  profilePicture?: string;
  profilePicturePublicId?: string;
  isPublic: boolean;
  owner: mongoose.Types.ObjectId;
  admins: mongoose.Types.ObjectId[];
  subscriberCount: number;
  analytics: {
    totalMessages: number;
    totalViews: number;
  };
  inviteLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChannelSchema = new Schema<IChannel>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    handle: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9_]{3,32}$/,
    },
    profilePicture: String,
    profilePicturePublicId: String,
    isPublic: { type: Boolean, default: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    subscriberCount: { type: Number, default: 0 },
    analytics: {
      totalMessages: { type: Number, default: 0 },
      totalViews: { type: Number, default: 0 },
    },
    inviteLink: String,
  },
  { timestamps: true }
);

ChannelSchema.index({ name: 'text', handle: 'text', description: 'text' });

export const Channel = mongoose.model<IChannel>('Channel', ChannelSchema);
