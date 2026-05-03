import { io } from "socket.io-client";

const SOCKET_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/api$/, "");

let socket = null;

export const connectSocket = (userId) => {
  if (socket?.connected) return;
  socket = io(SOCKET_URL, { transports: ["websocket"] });
  socket.on("connect", () => {
    socket.emit("join_user_room", userId);
  });
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

export const getSocket = () => socket;
