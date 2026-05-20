import { io } from "socket.io-client";

const SOCKET_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/api$/, "");

let socket = null;

// Listeners registered before the socket connects are stored here
// and attached automatically once the socket is ready.
const pendingListeners = {};

export const connectSocket = (userId) => {
  if (socket?.connected) return;
  socket = io(SOCKET_URL, { transports: ["websocket"] });
  socket.on("connect", () => {
    socket.emit("join_user_room", userId);
    Object.entries(pendingListeners).forEach(([event, handlers]) => {
      handlers.forEach((h) => socket.on(event, h));
    });
  });
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

export const getSocket = () => socket;

export const socketOn = (event, handler) => {
  if (!pendingListeners[event]) pendingListeners[event] = new Set();
  pendingListeners[event].add(handler);
  if (socket) socket.on(event, handler);
};

export const socketOff = (event, handler) => {
  pendingListeners[event]?.delete(handler);
  if (socket) socket.off(event, handler);
};
