import ImageKit from "@imagekit/nodejs";
import config from "./config.js";

const imageKitClient = new ImageKit({
  privateKey: config.IMAGEKIT_PRIVATE_KEY,
});

export default imageKitClient;
