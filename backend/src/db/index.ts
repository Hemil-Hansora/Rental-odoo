import mongoose from "mongoose";


export const connectDB = async (): Promise<void> => {
    try {
        console.log(process.env.MONGODB_URI)
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URI}/${process.env.DB_NAME}`
        );

        console.log(
            `\n <---- MongoDB connected: ${connectionInstance.connection.host} ---->\n`
        );
    } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`MongoDB connection error: ${error.message}`);
    } else {
      console.error("MongoDB connection failed with unknown error.");
    }
    process.exit(1);
  }
};