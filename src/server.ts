import app from "./app.js";
import config from "./config/config.js";
import connectDB from "./config/database.js";

connectDB();

app.get("/", (_req, res) => {
  res.send("Server running perfectly");
});

app.listen(config.PORT, () => {
  console.log(`Server running on port: ${config.PORT}`);
});
