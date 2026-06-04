import express from 'express';

const app = express();

app.get("/health", (req, res) => {
  return res.status(200).json({ status: "ok" });
});

app.listen(3000, () => {
  console.log("Backend running on port 3000");
});