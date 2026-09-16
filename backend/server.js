const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();

const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Get previous attempts
app.get("/api/attempts", (req, res) => {
  try {
    const data = fs.readFileSync("attempts.json", "utf8");
    const attempts = JSON.parse(data);

    res.json(attempts);
  } catch (error) {
    console.error("Error reading attempts:", error);
    res.status(500).json({
      message: "Unable to read attempts",
    });
  }
});
app.post("/api/attempts", (req, res) => {
  try {
    const data = fs.readFileSync("attempts.json", "utf8");
    const attempts = JSON.parse(data);

    const newAttempt = {
      id: Date.now(),
      wpm: req.body.wpm,
      accuracy: req.body.accuracy,
      duration: req.body.duration,
      date: new Date().toISOString(),
    };

    attempts.push(newAttempt);

    fs.writeFileSync(
      "attempts.json",
      JSON.stringify(attempts, null, 2)
    );

    res.status(201).json({
      message: "Attempt saved successfully",
      attempt: newAttempt,
    });
  } catch (error) {
    console.error("Error saving attempt:", error);

    res.status(500).json({
      message: "Unable to save attempt",
    });
  }
});
// Test route
app.get("/", (req, res) => {
  res.send("Typing Performance Tracker Backend is running!");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});