import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import {
    notFoundHandler,
    errorHandler,
} from "./middleware/error.middleware.js";

const app = express();
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;