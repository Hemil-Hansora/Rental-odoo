import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
// import { errorMiddleware } from "./middlewares";

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());



// app.use(errorMiddleware);
export { app };