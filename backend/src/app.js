//imports
import dotenv from "dotenv";
import express, { urlencoded } from "express";
import { Db } from "../DB/Db.js";
import router from "./routes/user.routes.js";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import { User } from "./models/user.models.js";

dotenv.config({ path: "../.env" });

//instance
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.frontendUri,
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
    origin: process.env.frontendUri,
    credentials: true,
  })
);

//routes
app.use("/api/v1/users", router);

Db();

//socket.io // socket/client contain client info
io.on("connection", (client) => {
  console.log("user connected", client.id);

  // send message
  client.on("message", async (msg) => {
    const roomId = [msg.to, msg.from].sort().join("_");

    //finding to and from users
    const user = await User.find({
      $or: [{ username: msg.to }, { username: msg.from }],
    });

    //time
    const now = new Date();
    const time = now.toLocaleTimeString(); // Format: "15:30:45"

    user.forEach(async (user) => {
      await User.findByIdAndUpdate(user._id, {
        $push: {
          messages: {
            message: msg.message,
            sender: msg.from,
            reciver: msg.to,
            time: time,
          },
        },
      });
    });

    console.log("message sent to database");
    io.to(roomId).emit("message", {
      message: msg.message,
      from: msg.from,
      to: msg.to,
    });
  });

  // join room
  client.on("joinroom", (msg) => {
    const rooms = Array.from(client.rooms);
    if (rooms[1] !== "") {
      client.leave(rooms[1]);
    }

    const roomId = [msg.to, msg.from].sort().join("_");
    client.join(roomId);
    console.log("client connected to ", roomId);
  });

  client.on("disconnect", () => {
    console.log("user disconnected", client.id);
  });
});

server.listen(process.env.PORT);

export { io };
