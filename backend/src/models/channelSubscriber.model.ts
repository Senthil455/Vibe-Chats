import mongoose, { Document, Schema } from 'mongoose';

export interface IChannelSubscriber extends Document {
  channel: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  isMuted: boolean;
  subscribedAt: Date;
}

const ChannelSubscriberSchema = new Schema<IChannelSubscriber>({
  channel: { type: Schema.Types.ObjectId, ref: 'Channel', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isMuted: { type: Boolean, default: false },
  subscribedAt: { type: Date, default: Date.now },
});

ChannelSubscriberSchema.index({ channel: 1, user: 1 }, { unique: true });

export const ChannelSubscriber = mongoose.model<IChannelSubscriber>(
  'ChannelSubscriber',
  ChannelSubscriberSchema
);
