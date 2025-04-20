import dotenv from "dotenv";
import express from "express";
import { Db } from "../DB/Db.js";

dotenv.config({ path: "../.env" });

const app = express();

Db();

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("hello");
});

app.listen(process.env.PORT || 3000);
