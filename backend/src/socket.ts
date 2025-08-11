import { Server as IOServer, Socket } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";

let io: IOServer | null = null;

export function initSocket(server: http.Server) {
  if (io) return io; // already initialized

  io = new IOServer(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    // pingInterval/pingTimeout and other options can be tuned
  });

  // Optional: JWT-based handshake auth example
  io.use((socket: Socket, next) => {
    try {
      // Token can be sent by client as: socket = io(URL, { auth: { token }})
      const token = socket.handshake.auth?.token || socket.handshake.headers.authorization;
      if (!token) {
        // If you want anonymous sockets, call next(); else reject
        // return next(new Error("Authentication error"));
        return next();
      }
      const raw = (token as string).replace(/^Bearer\s+/i, "");
      const payload = jwt.verify(raw, process.env.JWT_SECRET as string);
      // attach user payload to socket for later
      (socket as any).user = payload;
      return next();
    } catch (err) {
      // Authentication failed — allow or deny depending on your policy
      // next(new Error("Authentication error"));
      next();
    }
  });

  io.on("connection", (socket) => {
    console.log("socket connected:", socket.id);

    // If authenticated, join a private room for that user
    const user = (socket as any).user;
    if (user && (user as any).id) {
      const room = `user_${(user as any).id}`;
      socket.join(room);
      console.log(`socket ${socket.id} joined room ${room}`);
    }

    // allow client to join rooms (e.g., a product room or admin)
    socket.on("joinRoom", (roomName: string) => {
      socket.join(roomName);
    });

    socket.on("leaveRoom", (roomName: string) => socket.leave(roomName));

    socket.on("disconnect", (reason) => {
      console.log("socket disconnected:", socket.id, reason);
    });
  });

  return io;
}

export function getIO(): IOServer {
  if (!io) throw new Error("Socket.io not initialized. Call initSocket(server) first.");
  return io;
}
