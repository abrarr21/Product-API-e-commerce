import dotenv from "dotenv";

dotenv.config();

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is not provided in the .env file");
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not provided in the .env file");
}

const config = {
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  PORT: process.env.PORT || 8080,
};

export default config;
