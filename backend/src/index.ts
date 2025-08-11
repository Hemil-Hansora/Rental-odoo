import dotenv from 'dotenv'

dotenv.config()

import { app } from "./app";
import { connectDB } from "./db";

connectDB()
    .then(() => {
        app.on("error", (err) => {
            console.error("Error :", err);
            throw err;
        });

        app.listen(process.env.PORT || 3000, () => {
            console.log(`Server is running at port : ${process.env.PORT}`);
        });
    })
    .catch((err) => {
        console.log("MondoDb connection error !! : ", err);
    });