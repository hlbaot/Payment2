import { Server as NetServer } from 'http';
import { Socket } from 'net';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';

export type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io: ServerIO;
    };
  };
};

export default function SocketHandler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (res.socket.server.io) {
    console.log('Socket is already running');
  } else {
    console.log('Socket is initializing');
    const io = new ServerIO(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
    });
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Nhận tin nhắn mới
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.on('send-message', (data: any) => {
        // Gửi tin nhắn cho tất cả client khác
        socket.broadcast.emit('receive-message', data);
      });

      // Trạng thái "Đang nhập..."
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.on('typing', (data: any) => {
        socket.broadcast.emit('user-typing', data);
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.on('stop-typing', (data: any) => {
        socket.broadcast.emit('user-stop-typing', data);
      });

      // Trạng thái Online/Offline
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.on('user-online', (data: any) => {
        socket.broadcast.emit('user-status', { ...data, status: 'online' });
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        socket.broadcast.emit('user-status', { id: socket.id, status: 'offline' });
      });
    });
  }
  res.end();
}
