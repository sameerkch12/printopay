import { io, Socket } from 'socket.io-client';
import { forceHttpsForRenderUrl } from './api';

const API_BASE_URL = forceHttpsForRenderUrl(process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://printopay.onrender.com/api/v1');
const SOCKET_URL = API_BASE_URL.replace(/\/api\/v\d+\/?$/, '');

let socket: Socket | null = null;

export function getRealtimeSocket() {
  socket ??= io(SOCKET_URL, {
    transports: ['websocket'],
  });

  return socket;
}
