import { io } from 'socket.io-client';
export const socket = io(import.meta.env.VITE_WEBSOCKET_URL || import.meta.env.VITE_SERVER_URL || undefined, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 2500,
});
