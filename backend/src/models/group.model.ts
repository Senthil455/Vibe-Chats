import mongoose, { Document, Schema } from 'mongoose';

export type MemberRole = 'admin' | 'moderator' | 'member';

export interface IGroupMember {
  user: mongoose.Types.ObjectId;
  role: MemberRole;
  joinedAt: Date;
  isMuted: boolean;
  mutedUntil?: Date;
}

export interface IGroup extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  profilePicture?: string;
  profilePicturePublicId?: string;
  chat: mongoose.Types.ObjectId;
  members: IGroupMember[];
  settings: {
    onlyAdminsCanMessage: boolean;
    onlyAdminsCanEditInfo: boolean;
    approvalRequired: boolean;
  };
  inviteLink: string;
  pinnedMessages: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    profilePicture: String,
    profilePicturePublicId: String,
    chat: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    members: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        role: {
          type: String,
          enum: ['admin', 'moderator', 'member'],
          default: 'member',
        },
        joinedAt: { type: Date, default: Date.now },
        isMuted: { type: Boolean, default: false },
        mutedUntil: Date,
      },
    ],
    settings: {
      onlyAdminsCanMessage: { type: Boolean, default: false },
      onlyAdminsCanEditInfo: { type: Boolean, default: false },
      approvalRequired: { type: Boolean, default: false },
    },
    inviteLink: { type: String, unique: true },
    pinnedMessages: [{ type: Schema.Types.ObjectId, ref: 'Message' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

GroupSchema.index({ name: 'text' });

export const Group = mongoose.model<IGroup>('Group', GroupSchema);
