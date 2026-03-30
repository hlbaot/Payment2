import { SupportMessageStatus } from '../entities/support-message.entity';

export class UpdateSupportMessageDto {
  userId?: number;
  supporterId?: number;
  messageText?: string;
  type?: string;
  depositAmount?: string;
  status?: SupportMessageStatus;
}
