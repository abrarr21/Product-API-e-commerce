import app from "./app.js";
import config from "./config/config.js";
import connectDB from "./config/database.js";
import userRouter from "./routes/user.route.js";

connectDB();

app.get("/", (_req, res) => {
  res.send("Server running perfectly");
});

app.use("/api/auth", userRouter);

app.listen(config.PORT, () => {
  console.log(`Server running on port: ${config.PORT}`);
});
