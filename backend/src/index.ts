import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectDB } from "./db/index";
import { createServer } from "http";
import { initSocket } from "./socket"; // new

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    // create a raw http server from express app
    const server = createServer(app);

    // initialize socket.io with the server
    initSocket(server);

    // attach error handling if you want
    server.on("error", (err) => {
      console.error("Server error:", err);
      throw err;
    });

    server.listen(PORT, () => {
      console.log(`Server is running at port : ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDb connection error !! : ", err);
  });
