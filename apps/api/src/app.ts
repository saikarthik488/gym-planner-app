import express from "express";
import cors from "cors";
import morgan from "morgan";
import { env } from "./config/env";
import { router } from "./routes";

export const app = express();

app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "taskswift-api" });
});

app.use("/api", router);