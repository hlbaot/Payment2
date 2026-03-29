import { SupportMessageStatus } from '../entities/support-message.entity';

export class CreateSupportMessageDto {
    userId: number;
    supporterId: number;
    messageText: string;
    type: string;
    status?: SupportMessageStatus;
}
