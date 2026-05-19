import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { env } from '../config/env';

let io: Server | null = null;

export function initRealtime(server: HttpServer) {
  const allowedOrigins = env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);

  io = new Server(server, {
    cors: {
      origin: env.CLIENT_ORIGIN === '*' ? true : allowedOrigins,
    },
  });

  io.on('connection', (socket) => {
    socket.emit('realtime:ready', { ok: true });
  });
}

export function emitRealtime(event: string, payload: Record<string, unknown>) {
  io?.emit(event, payload);
}
