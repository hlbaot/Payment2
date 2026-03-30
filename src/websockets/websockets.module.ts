import { forwardRef, Module } from "@nestjs/common";
import { ChatGateway } from "./chat.gateway";
import { NotificationModule } from "src/notification/notification.module";
import { SupportMessageModule } from "src/support-message/support-message.module";
import { WebsocketEventsService } from "./websocket-events.service";

@Module({
  imports: [SupportMessageModule, forwardRef(() => NotificationModule)],
  providers: [ChatGateway, WebsocketEventsService],
  exports: [WebsocketEventsService],
})
export class WebsocketsModule {}
