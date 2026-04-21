import mongoose, { Document, Schema } from 'mongoose';

export interface IChat extends Document {
  _id: mongoose.Types.ObjectId;
  type: 'private' | 'group';
  participants: mongoose.Types.ObjectId[];
  group?: mongoose.Types.ObjectId;
  lastMessage?: mongoose.Types.ObjectId;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>(
  {
    type: {
      type: String,
      enum: ['private', 'group'],
      required: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    group: { type: Schema.Types.ObjectId, ref: 'Group' },
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ChatSchema.index({ participants: 1 });
ChatSchema.index({ lastActivity: -1 });

export const Chat = mongoose.model<IChat>('Chat', ChatSchema);
