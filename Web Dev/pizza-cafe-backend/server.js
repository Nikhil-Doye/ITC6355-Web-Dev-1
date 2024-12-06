const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const path = require("path");

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, ".."))); // Serve Web_Dev folder

// Database connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "pizza_cafe",
  password: "Johnnash",
  port: 5431,
});

// Feedback API
app.post("/api/feedback", async (req, res) => {
  const { name, email, message } = req.body;

  console.log("Received Feedback:", { name, email, message });

  try {
    const query = `
            INSERT INTO feedback (name, email, message, created_at)
            VALUES ($1, $2, $3, NOW()) RETURNING *`;
    const values = [name, email, message];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully!",
      feedback: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Server error!" });
  }
});

// Catch-all route for missing pages
app.get("*", (req, res) => {
  res.status(404).send("Page not found");
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
