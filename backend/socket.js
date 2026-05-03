import { Server } from "socket.io";

let io = null;

export const initSocket = (server) => {
  io = new Server(server, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    socket.on("join_user_room", (userId) => {
      socket.join(`user_${userId}`);
    });
  });
};

export const getIO = () => io;
