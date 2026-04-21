import { Router } from 'express';
import {
  createGroup, getGroup, updateGroup,
  addMembers, removeMember, leaveGroup, updateMemberRole, joinByInviteLink,
} from '../controllers/group.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../config/cloudinary';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticate);

router.post('/', asyncHandler(createGroup));
router.get('/join/:inviteLink', asyncHandler(joinByInviteLink));
router.get('/:groupId', asyncHandler(getGroup));
router.put('/:groupId', upload.single('profilePicture'), asyncHandler(updateGroup));
router.post('/:groupId/members', asyncHandler(addMembers));
router.delete('/:groupId/members/:memberId', asyncHandler(removeMember));
router.post('/:groupId/leave', asyncHandler(leaveGroup));
router.put('/:groupId/members/:memberId/role', asyncHandler(updateMemberRole));

export default router;
