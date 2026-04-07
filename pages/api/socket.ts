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
    res.end();
    return;
  }

  console.log('Socket.IO initializing...');
  const io = new ServerIO(res.socket.server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: { origin: '*' },
  });
  res.socket.server.io = io;

  io.on('connection', (socket) => {
    let socketEmail = '';

    // Join the appropriate room when client identifies itself
    socket.on('user-online', (data: { email?: string; role?: string }) => {
      const email = (data.email ?? '').trim().toLowerCase();
      if (email) {
        socketEmail = email;
        // Join per-user conversation room
        void socket.join(`conversation:${email}`);
        // Supporters and admins join global support room
        if (data.role === 'supporter' || data.role === 'admin') {
          void socket.join('support-staff');
        }
      }
      socket.broadcast.emit('user-status', { ...data, status: 'online' });
    });

    // Route messages to the right participants
    socket.on('send-message', (data: { toEmail?: string; from?: string; text?: string; time?: string; imageUrl?: string }) => {
      const toEmail = (data.toEmail ?? '').trim().toLowerCase();
      if (!toEmail) {
        socket.broadcast.emit('receive-message', data);
        return;
      }
      // User widget listening in the conversation room
      socket.to(`conversation:${toEmail}`).emit('receive-message', data);
      // All supporter/admin panels
      socket.to('support-staff').emit('receive-message', data);
    });

    // Typing indicators
    socket.on('typing', (data: { toEmail?: string; from?: string }) => {
      const toEmail = (data.toEmail ?? '').trim().toLowerCase();
      if (toEmail) {
        socket.to(`conversation:${toEmail}`).emit('user-typing', data);
        socket.to('support-staff').emit('user-typing', data);
      } else {
        socket.broadcast.emit('user-typing', data);
      }
    });

    socket.on('stop-typing', (data: { toEmail?: string; from?: string }) => {
      const toEmail = (data.toEmail ?? '').trim().toLowerCase();
      if (toEmail) {
        socket.to(`conversation:${toEmail}`).emit('user-stop-typing', data);
        socket.to('support-staff').emit('user-stop-typing', data);
      } else {
        socket.broadcast.emit('user-stop-typing', data);
      }
    });

    socket.on('disconnect', () => {
      if (socketEmail) {
        socket.broadcast.emit('user-status', { email: socketEmail, status: 'offline' });
      }
    });
  });

  res.end();
}
