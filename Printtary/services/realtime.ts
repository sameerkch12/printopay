import { io, Socket } from 'socket.io-client';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api/v1';
const SOCKET_URL = API_BASE_URL.replace(/\/api\/v\d+\/?$/, '');

let socket: Socket | null = null;

export function getRealtimeSocket() {
  socket ??= io(SOCKET_URL, {
    transports: ['websocket'],
  });

  return socket;
}
