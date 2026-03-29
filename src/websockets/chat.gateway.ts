import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { NotificationService } from "src/notification/notification.service";
import { SupportMessageStatus } from "src/support-message/entities/support-message.entity";
import { SupportMessageService } from "src/support-message/support-message.service";

type SocketUser = {
  id: number;
};

@WebSocketGateway({
  cors: { origin: "*" },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly supportMessageService: SupportMessageService,
    private readonly notificationService: NotificationService,
  ) {}

  // CONNECT → JOIN ROOM RIÊNG
  handleConnection(client: Socket) {
    if (client.data && client.data.user) {
      const user = client.data.user; // từ JWT adapter
      const room = `user_${user.id}`;
      client.join(room);

      console.log(`User ${user.id} joined ${room}`);
    } else {
      console.log("Client connected without authentication data");
      // client.disconnect(); // Tùy chọn: ngắt kết nối nếu bắt buộc phải có auth
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data && client.data.user) {
      console.log(`User ${client.data.user.id} disconnected`);
    } else {
      console.log("Client disconnected");
    }
  }

  // SEND MESSAGE 1–1
  @SubscribeMessage("private-message")
  async handlePrivateMessage(
    @MessageBody()
    data: {
      receiverId: number;
      message: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const sender = client.data.user as SocketUser | undefined;
    if (!sender) {
      console.warn("Sender not authenticated");
      return;
    }

    console.log("🔥 SOCKET EVENT RECEIVED");
    console.log("DATA:", data);
    console.log("USER:", sender);

    // const payload = {
    //   senderId: sender.id,
    //   message: saved.message,
    //   time: saved.createdAt,
    // };

    // // Gửi cho người nhận
    // this.server.to(`user_${data.receiverId}`).emit("private-message", payload);

    // 2️⃣ Tạo notification với notificationService (sử dụng hàm create từ NotificationService)
    
    try {
      // 1️⃣ Lưu DB
      const saved = await this.supportMessageService.create({
        userId: sender.id,
        supporterId: data.receiverId,
        messageText: data.message,
        type: "private",
        status: SupportMessageStatus.UNREAD,
      });

      // 2️⃣ Emit message realtime cho người nhận
      const payload = {
        senderId: sender.id,
        message: saved.messageText,
        time: saved.createdAt,
      };

      this.server
        .to(`user_${data.receiverId}`)
        .emit("private-message", payload);

      // 3️⃣ Tạo notification và emit (Tách biệt để lỗi notif không ảnh hưởng chat)
      try {
        await this.notificationService.create({
          senderId: sender.id,
          receiverId: data.receiverId,
          message: data.message,
        });

        const notificationPayload = {
          senderId: sender.id,
          receiverId: data.receiverId,
          content: data.message,
          createdAt: saved.createdAt,
          type: "support_reply",
        };

        this.server
          .to(`user_${data.receiverId}`)
          .emit("notification:new", notificationPayload);
      } catch (notifError) {
        console.error("Error creating/sending notification:", notifError);
      }
    } catch (saveError) {
      console.error("Error saving chat message:", saveError);
    }
  }
}
