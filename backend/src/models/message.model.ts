import mongoose, { Document, Schema } from 'mongoose';

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'voice' | 'system';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface IReaction {
  emoji: string;
  users: mongoose.Types.ObjectId[];
}

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  chat: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  type: MessageType;
  content?: string;
  media?: {
    url: string;
    publicId: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    duration?: number; // for audio/video in seconds
    thumbnail?: string;
  };
  replyTo?: mongoose.Types.ObjectId;
  reactions: IReaction[];
  status: MessageStatus;
  readBy: {
    user: mongoose.Types.ObjectId;
    readAt: Date;
  }[];
  deliveredTo: {
    user: mongoose.Types.ObjectId;
    deliveredAt: Date;
  }[];
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedFor: mongoose.Types.ObjectId[]; // users who deleted for themselves
  deletedAt?: Date;
  isForwarded: boolean;
  forwardedFrom?: mongoose.Types.ObjectId;
  isPinned: boolean;
  isStarred: mongoose.Types.ObjectId[]; // user ids who starred
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    chat: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'document', 'voice', 'system'],
      default: 'text',
    },
    content: { type: String, maxlength: 5000 },
    media: {
      url: String,
      publicId: String,
      fileName: String,
      fileSize: Number,
      mimeType: String,
      duration: Number,
      thumbnail: String,
    },
    replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
    reactions: [
      {
        emoji: { type: String, required: true },
        users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      },
    ],
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    readBy: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],
    deliveredTo: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        deliveredAt: { type: Date, default: Date.now },
      },
    ],
    isEdited: { type: Boolean, default: false },
    editedAt: Date,
    isDeleted: { type: Boolean, default: false },
    deletedFor: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    deletedAt: Date,
    isForwarded: { type: Boolean, default: false },
    forwardedFrom: { type: Schema.Types.ObjectId, ref: 'Message' },
    isPinned: { type: Boolean, default: false },
    isStarred: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

MessageSchema.index({ chat: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ content: 'text' });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
