import { Response } from 'express';
import mongoose from 'mongoose';
import { Group } from '../models/group.model';
import { Chat } from '../models/chat.model';
import { Message } from '../models/message.model';
import { User } from '../models/user.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/errorHandler';
import { generateInviteLink } from '../utils/helpers';
import { deleteFromCloudinary } from '../config/cloudinary';
import { getIo } from '../socket/index';

// POST /api/groups
export const createGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, description, memberIds } = req.body;
  const userId = req.user!._id;

  const allMemberIds = [...new Set([userId, ...(memberIds || [])])];

  // Verify all members exist
  const members = await User.find({ _id: { $in: allMemberIds } });
  if (members.length !== allMemberIds.length) {
    throw new AppError('One or more users not found', 404);
  }

  // Create group chat
  const chat = await Chat.create({
    type: 'group',
    participants: allMemberIds,
  });

  const group = await Group.create({
    name,
    description,
    chat: chat._id,
    inviteLink: generateInviteLink(),
    members: allMemberIds.map((id) => ({
      user: id,
      role: id.toString() === userId.toString() ? 'admin' : 'member',
    })),
    createdBy: userId,
  });

  // Link group to chat
  await Chat.findByIdAndUpdate(chat._id, { group: group._id });

  // Send system message
  await Message.create({
    chat: chat._id,
    sender: userId,
    type: 'system',
    content: `${req.user!.username} created the group "${name}"`,
  });

  await group.populate('members.user', 'username profilePicture');

  const io = getIo();
  allMemberIds.forEach((memberId) => {
    io.to(`user:${memberId}`).emit('group_created', { group, chatId: chat._id });
  });

  res.status(201).json({ group, chatId: chat._id });
};

// GET /api/groups/:groupId
export const getGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  const { groupId } = req.params;
  const userId = req.user!._id;

  const group = await Group.findOne({
    _id: groupId,
    'members.user': userId,
  }).populate('members.user', 'username profilePicture bio');

  if (!group) throw new AppError('Group not found', 404);
  res.json({ group });
};

// PUT /api/groups/:groupId
export const updateGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  const { groupId } = req.params;
  const { name, description, settings } = req.body;
  const userId = req.user!._id;

  const group = await Group.findById(groupId);
  if (!group) throw new AppError('Group not found', 404);

  const member = group.members.find((m) => m.user.toString() === userId);
  if (!member || !['admin', 'moderator'].includes(member.role)) {
    throw new AppError('Only admins can update group info', 403);
  }

  if (name) group.name = name;
  if (description !== undefined) group.description = description;
  if (settings) group.settings = { ...group.settings, ...settings };

  if (req.file) {
    if (group.profilePicturePublicId) {
      await deleteFromCloudinary(group.profilePicturePublicId);
    }
    group.profilePicture = (req.file as any).path;
    group.profilePicturePublicId = (req.file as any).filename;
  }

  await group.save();

  const io = getIo();
  io.to(group.chat.toString()).emit('group_updated', { groupId, name, description });

  res.json({ group });
};

// POST /api/groups/:groupId/members — add members
export const addMembers = async (req: AuthRequest, res: Response): Promise<void> => {
  const { groupId } = req.params;
  const { userIds } = req.body;
  const userId = req.user!._id;

  const group = await Group.findById(groupId);
  if (!group) throw new AppError('Group not found', 404);

  const member = group.members.find((m) => m.user.toString() === userId);
  if (!member || member.role === 'member') {
    throw new AppError('Only admins/moderators can add members', 403);
  }

  const newMembers = userIds.filter(
    (id: string) => !group.members.some((m) => m.user.toString() === id)
  );

  group.members.push(...newMembers.map((id: string) => ({ user: new mongoose.Types.ObjectId(id), role: 'member' as const, joinedAt: new Date(), isMuted: false })));

  await Chat.findByIdAndUpdate(group.chat, {
    $addToSet: { participants: { $each: newMembers } },
  });

  await group.save();

  await Message.create({
    chat: group.chat,
    sender: userId,
    type: 'system',
    content: `${newMembers.length} member(s) added to the group`,
  });

  const io = getIo();
  io.to(group.chat.toString()).emit('members_added', { groupId, userIds: newMembers });

  res.json({ message: 'Members added', group });
};

// DELETE /api/groups/:groupId/members/:memberId
export const removeMember = async (req: AuthRequest, res: Response): Promise<void> => {
  const { groupId, memberId } = req.params;
  const userId = req.user!._id;

  const group = await Group.findById(groupId);
  if (!group) throw new AppError('Group not found', 404);

  const requester = group.members.find((m) => m.user.toString() === userId);
  if (!requester || requester.role === 'member') {
    throw new AppError('Only admins can remove members', 403);
  }

  const target = group.members.find((m) => m.user.toString() === memberId);
  if (!target) throw new AppError('Member not found', 404);
  if (target.role === 'admin' && requester.role !== 'admin') {
    throw new AppError('Cannot remove an admin', 403);
  }

  group.members = group.members.filter((m) => m.user.toString() !== memberId);
  await Chat.findByIdAndUpdate(group.chat, { $pull: { participants: memberId } });
  await group.save();

  const io = getIo();
  io.to(group.chat.toString()).emit('member_removed', { groupId, memberId });
  io.to(`user:${memberId}`).emit('removed_from_group', { groupId });

  res.json({ message: 'Member removed' });
};

// POST /api/groups/:groupId/leave
export const leaveGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  const { groupId } = req.params;
  const userId = req.user!._id;

  const group = await Group.findById(groupId);
  if (!group) throw new AppError('Group not found', 404);

  group.members = group.members.filter((m) => m.user.toString() !== userId);
  await Chat.findByIdAndUpdate(group.chat, { $pull: { participants: userId } });
  await group.save();

  await Message.create({
    chat: group.chat,
    sender: userId,
    type: 'system',
    content: `${req.user!.username} left the group`,
  });

  const io = getIo();
  io.to(group.chat.toString()).emit('member_left', { groupId, userId });

  res.json({ message: 'Left group' });
};

// PUT /api/groups/:groupId/members/:memberId/role
export const updateMemberRole = async (req: AuthRequest, res: Response): Promise<void> => {
  const { groupId, memberId } = req.params;
  const { role } = req.body;
  const userId = req.user!._id;

  const group = await Group.findById(groupId);
  if (!group) throw new AppError('Group not found', 404);

  const requester = group.members.find((m) => m.user.toString() === userId);
  if (!requester || requester.role !== 'admin') {
    throw new AppError('Only admins can change roles', 403);
  }

  const target = group.members.find((m) => m.user.toString() === memberId);
  if (!target) throw new AppError('Member not found', 404);

  target.role = role;
  await group.save();

  res.json({ message: 'Role updated' });
};

// GET /api/groups/join/:inviteLink
export const joinByInviteLink = async (req: AuthRequest, res: Response): Promise<void> => {
  const { inviteLink } = req.params;
  const userId = req.user!._id;

  const group = await Group.findOne({ inviteLink });
  if (!group) throw new AppError('Invalid invite link', 404);

  const alreadyMember = group.members.some((m) => m.user.toString() === userId);
  if (alreadyMember) {
    res.json({ message: 'Already a member', group, chatId: group.chat });
    return;
  }

  group.members.push({ user: new mongoose.Types.ObjectId(userId), role: 'member', joinedAt: new Date(), isMuted: false });
  await Chat.findByIdAndUpdate(group.chat, { $addToSet: { participants: userId } });
  await group.save();

  await Message.create({
    chat: group.chat,
    sender: userId,
    type: 'system',
    content: `${req.user!.username} joined via invite link`,
  });

  res.json({ message: 'Joined group', group, chatId: group.chat });
};
