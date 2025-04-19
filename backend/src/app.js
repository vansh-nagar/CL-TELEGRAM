import express from "express";
import dotenv from "dotenv";

const app = express();

dotenv.config({ parth: "../.env" });

app.get("/", (req, res) => {
  res.send("hello");
});

app.listen(process.env.PORT);
