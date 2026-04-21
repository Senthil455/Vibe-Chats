import { Response } from 'express';
import { Channel } from '../models/channel.model';
import { ChannelSubscriber } from '../models/channelSubscriber.model';
import { ChannelPost } from '../models/channelPost.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/errorHandler';
import { generateInviteLink } from '../utils/helpers';
import { getIo } from '../socket/index';

// POST /api/channels
export const createChannel = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, handle, description, isPublic } = req.body;
  const userId = req.user!._id;

  const existing = await Channel.findOne({ handle });
  if (existing) throw new AppError('Channel handle already taken', 409);

  const channel = await Channel.create({
    name,
    handle,
    description,
    isPublic: isPublic !== false,
    owner: userId,
    admins: [userId],
    inviteLink: generateInviteLink(),
    profilePicture: req.file ? (req.file as any).path : undefined,
    profilePicturePublicId: req.file ? (req.file as any).filename : undefined,
  });

  // Auto-subscribe owner
  await ChannelSubscriber.create({ channel: channel._id, user: userId });
  await Channel.findByIdAndUpdate(channel._id, { $inc: { subscriberCount: 1 } });

  res.status(201).json({ channel });
};

// GET /api/channels/search?q=
export const searchChannels = async (req: AuthRequest, res: Response): Promise<void> => {
  const { q } = req.query;
  const filter: any = { isPublic: true };
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { handle: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
    ];
  }

  const channels = await Channel.find(filter)
    .select('name handle description profilePicture subscriberCount isPublic')
    .sort({ subscriberCount: -1 })
    .limit(20);

  res.json({ channels });
};

// GET /api/channels/my — user's subscribed channels
export const getMyChannels = async (req: AuthRequest, res: Response): Promise<void> => {
  const subs = await ChannelSubscriber.find({ user: req.user!._id }).populate(
    'channel',
    'name handle profilePicture subscriberCount'
  );
  res.json({ channels: subs.map((s) => s.channel) });
};

// GET /api/channels/:channelId
export const getChannel = async (req: AuthRequest, res: Response): Promise<void> => {
  const { channelId } = req.params;
  const channel = await Channel.findById(channelId).populate('owner', 'username profilePicture');
  if (!channel) throw new AppError('Channel not found', 404);

  const isSubscribed = await ChannelSubscriber.exists({
    channel: channelId,
    user: req.user!._id,
  });

  const isAdmin = channel.admins.some((a) => a.toString() === req.user!._id);

  res.json({ channel, isSubscribed: !!isSubscribed, isAdmin });
};

// POST /api/channels/:channelId/subscribe
export const subscribe = async (req: AuthRequest, res: Response): Promise<void> => {
  const { channelId } = req.params;
  const userId = req.user!._id;

  const channel = await Channel.findById(channelId);
  if (!channel) throw new AppError('Channel not found', 404);

  const existing = await ChannelSubscriber.findOne({ channel: channelId, user: userId });
  if (existing) {
    res.json({ message: 'Already subscribed' });
    return;
  }

  await ChannelSubscriber.create({ channel: channelId, user: userId });
  await Channel.findByIdAndUpdate(channelId, { $inc: { subscriberCount: 1 } });

  res.json({ message: 'Subscribed' });
};

// DELETE /api/channels/:channelId/subscribe
export const unsubscribe = async (req: AuthRequest, res: Response): Promise<void> => {
  const { channelId } = req.params;
  const userId = req.user!._id;

  const channel = await Channel.findById(channelId);
  if (!channel) throw new AppError('Channel not found', 404);

  await ChannelSubscriber.deleteOne({ channel: channelId, user: userId });
  await Channel.findByIdAndUpdate(channelId, { $inc: { subscriberCount: -1 } });

  res.json({ message: 'Unsubscribed' });
};

// POST /api/channels/:channelId/posts
export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
  const { channelId } = req.params;
  const { content, isSilent } = req.body;
  const userId = req.user!._id;

  const channel = await Channel.findById(channelId);
  if (!channel) throw new AppError('Channel not found', 404);

  const isAdmin = channel.admins.some((a) => a.toString() === userId.toString());
  if (!isAdmin) throw new AppError('Only channel admins can post', 403);

  const mediaArr: any[] = [];
  if (req.file) {
    mediaArr.push({
      url: (req.file as any).path,
      publicId: (req.file as any).filename,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });
  }

  const post = await ChannelPost.create({
    channel: channelId,
    author: userId,
    content,
    media: mediaArr,
    isSilent: !!isSilent,
  });

  await Channel.findByIdAndUpdate(channelId, {
    $inc: { 'analytics.totalMessages': 1 },
  });

  await post.populate('author', 'username profilePicture');

  const io = getIo();
  io.to(`channel:${channelId}`).emit('channel_post', post);

  res.status(201).json({ post });
};

// GET /api/channels/:channelId/posts
export const getPosts = async (req: AuthRequest, res: Response): Promise<void> => {
  const { channelId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const channel = await Channel.findById(channelId);
  if (!channel) throw new AppError('Channel not found', 404);

  if (!channel.isPublic) {
    const isSub = await ChannelSubscriber.exists({ channel: channelId, user: req.user!._id });
    if (!isSub) throw new AppError('Subscribe to view posts', 403);
  }

  const posts = await ChannelPost.find({ channel: channelId, isDeleted: false })
    .populate('author', 'username profilePicture')
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  // Increment view count
  const postIds = posts.map((p) => p._id);
  await ChannelPost.updateMany({ _id: { $in: postIds } }, { $inc: { viewCount: 1 } });

  res.json({ posts: posts.reverse(), page: Number(page) });
};

// GET /api/channels/:channelId/analytics
export const getAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  const { channelId } = req.params;
  const userId = req.user!._id;

  const channel = await Channel.findById(channelId);
  if (!channel) throw new AppError('Channel not found', 404);

  const isAdmin = channel.admins.some((a) => a.toString() === userId.toString());
  if (!isAdmin) throw new AppError('Unauthorized', 403);

  const totalPosts = await ChannelPost.countDocuments({ channel: channelId, isDeleted: false });
  const totalViews = channel.analytics.totalViews;

  res.json({
    analytics: {
      subscriberCount: channel.subscriberCount,
      totalPosts,
      totalViews,
      totalMessages: channel.analytics.totalMessages,
    },
  });
};
