import { Module } from "@nestjs/common";
import { ChatGateway } from "./chat.gateway";
import { NotificationModule } from "src/notification/notification.module";
import { SupportMessageModule } from "src/support-message/support-message.module";

@Module({
  imports: [SupportMessageModule, NotificationModule],
  providers: [ChatGateway],
})
export class WebsocketsModule {}
