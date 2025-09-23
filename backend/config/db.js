import mongoose from "mongoose";
import { config } from "./config.js";

export const connectDB = async () => {
  try {
    console.log(`Connecting to MongoDB at ${config.server.MONGODB_URI}...`);

    await mongoose.connect(config.server.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(" MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1); 
  }
};

export default connectDB;