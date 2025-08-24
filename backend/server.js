// ====== Bingo Backend Server (Express) ======
import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// Health check route
app.get("/", (req, res) => {
  res.send("✅ Bingo backend is running on Render!");
});

// Example API route (later we connect frontend + bot)
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Bingo Backend!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
