import mongoose, { Document, Schema } from 'mongoose';

export interface IChannelPost extends Document {
  _id: mongoose.Types.ObjectId;
  channel: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content?: string;
  media?: {
    url: string;
    publicId: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    duration?: number;
    thumbnail?: string;
  }[];
  viewCount: number;
  reactions: {
    emoji: string;
    count: number;
    users: mongoose.Types.ObjectId[];
  }[];
  isSilent: boolean;
  isPinned: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChannelPostSchema = new Schema<IChannelPost>(
  {
    channel: { type: Schema.Types.ObjectId, ref: 'Channel', required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, maxlength: 10000 },
    media: [
      {
        url: String,
        publicId: String,
        fileName: String,
        fileSize: Number,
        mimeType: String,
        duration: Number,
        thumbnail: String,
      },
    ],
    viewCount: { type: Number, default: 0 },
    reactions: [
      {
        emoji: String,
        count: { type: Number, default: 0 },
        users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      },
    ],
    isSilent: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ChannelPostSchema.index({ channel: 1, createdAt: -1 });

export const ChannelPost = mongoose.model<IChannelPost>('ChannelPost', ChannelPostSchema);
