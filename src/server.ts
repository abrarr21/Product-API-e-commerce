import app from "./app.js";

app.get("/", (_req, res) => {
  res.send("Server running perfectly");
});

app.listen(6969, () => {
  console.log("server running on port: 6969");
});
