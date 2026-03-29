import { IoAdapter } from '@nestjs/platform-socket.io';
import { INestApplicationContext } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

export class SocketIoAdapter extends IoAdapter {
  constructor(private app: INestApplicationContext) {
    super(app);
  }

  createIOServer(port: number, options?: any) {
    const server = super.createIOServer(port, {
      cors: {
        origin: 'http://localhost:3000',
        credentials: true,
      },
    });

    server.use((socket : any, next : any) => {
      try {
        const token = socket.handshake.auth?.token;
        if (!token) {
          return next(new Error('No token'));
        }

        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET!,
        ) as any;
        const userId = Number(decoded.sub);

        if (Number.isNaN(userId)) {
          return next(new Error('Invalid token payload: sub must be number'));
        }
        socket.data.user = {
          id: userId,
          email: decoded.email,
          roles: decoded.roles,
        };

        next();
      } catch (err) {
        next(new Error('Unauthorized'));
      }
    });

    return server;
  }
}
