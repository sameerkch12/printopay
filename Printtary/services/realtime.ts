import { io, Socket } from 'socket.io-client';
import { getApiBaseUrl } from './apiConfig';

let socket: Socket | null = null;

export function getRealtimeSocket() {
  const socketUrl = getApiBaseUrl().replace(/\/api\/v\d+\/?$/, '');
  socket ??= io(socketUrl, {
    transports: ['websocket'],
  });

  return socket;
}
