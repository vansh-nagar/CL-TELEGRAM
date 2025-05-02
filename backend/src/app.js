//imports
import dotenv from "dotenv";
import express, { urlencoded } from "express";
import { Db } from "../DB/Db.js";
import router from "./routes/user.routes.js";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

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
  client.on("message", (message) => {
    console.log("user message", message, client.id);
    io.emit("message", message);
  });
});

server.listen(3000);
