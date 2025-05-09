//imports
import dotenv from "dotenv";
import express, { urlencoded } from "express";
import { Db } from "../DB/Db.js";
import router from "./routes/user.routes.js";
import { createServer } from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import { setUpSocketIo } from "./socket.io.js";
import redis from "redis";

dotenv.config({ path: "../.env" });

//instance
const app = express();
const server = createServer(app);
setUpSocketIo(server);
const redisClient = redis
  .createClient()
  .on("error", (error) => console.log(error));

await redisClient.connect();
console.log("✅ Redis connected");

//middlewares
app.use(express.json());
app.use(urlencoded({ extended: true, limit: "16kb" }));

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

server.listen(process.env.PORT);
export { redisClient };
