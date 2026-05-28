import mongoose from "mongoose";
import config from "./config.js";

const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log("connected to MongoDB ✅");
  } catch (error) {
    console.log("error connecting to mongodb: ", error);
  }
};

export default connectDB;
