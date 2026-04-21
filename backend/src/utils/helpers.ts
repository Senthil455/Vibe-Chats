import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateInviteLink = (): string => {
  return crypto.randomBytes(16).toString('hex');
};

export const generateUUID = (): string => uuidv4();

export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};
