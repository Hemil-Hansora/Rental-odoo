import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { errorMiddleware } from "./middlewares/index";

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

import userRouter from "./routes/user.routes";


app.use("/api/v1/user", userRouter);



app.use(errorMiddleware);
export default app ;