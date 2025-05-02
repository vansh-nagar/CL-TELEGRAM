//imports
import dotenv from "dotenv";
import express, { urlencoded } from "express";
import { Db } from "../DB/Db.js";
import router from "./routes/user.routes.js";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Socket } from "dgram";

dotenv.config({ path: "../.env" });

//instance
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

//middlewares
app.use(urlencoded({ extended: true, limit: "16kb" }));
app.use(express.json({ limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

//routes
app.use("/api/v1/users", router);

Db();

//socket.io // socket/client contain client info
io.on("connection", (client) => {
  console.log("user connected", client.id);

  let roomId;
  client.on("joinRoom", (message) => {
    roomId = [message.from, message.to].sort().join("_");

    io.to(roomId).emit("message", message.first);

    if (client.rooms.has(roomId)) {
      console.log("client already in room", roomId);
      return;
    }
    client.join(roomId);
    console.log("client joined room", roomId);
  });

  client.on("message", (message) => {
    io.to(roomId).emit("message", message);
  });

  io.send("hello from server");
});

server.listen(3000);

export { io };
