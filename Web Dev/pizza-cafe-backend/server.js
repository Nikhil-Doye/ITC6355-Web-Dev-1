const { Pool } = require("pg");
const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const users = []; // Users database

const app = express();

require("dotenv").config(); // Load environment variables
JWT_SECRET =
  "8698b15845562613e8912315fb9bd50b5db0e7c78fd6d4f0da34b170bce801045e4091f57d5208def1ac0c635a52958e661a7a338b79bd7a0ff4f0c152e2384f";

app.use(bodyParser.json());
app.use(
  session({
    secret: JWT_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  console.log("Session:", req.session);
  console.log("User:", req.user);
  next();
});

// Database connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "pizza_cafe",
  password: "Johnnash",
  port: 5431,
});

// Serialize the User
passport.serializeUser((user, done) => {
  console.log("Serializing user:", user);
  done(null, user.id); // Use a unique identifier, such as user.id
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log("Deserializing user with ID:", id); // Debug log
    const query = "SELECT id, email FROM users WHERE id = $1";
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return done(new Error("User not found"), null);
    }

    console.log("User found during deserialization:", result.rows[0]); // Debug log
    done(null, result.rows[0]); // Attach user object to req.user
  } catch (err) {
    console.error("Error in deserializeUser:", err);
    done(err, null);
  }
});

const port = 3000;

// Middleware
app.use(express.static(path.join(__dirname, ".."))); // Serve Web_Dev folder

app.get("/api/user", (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({ user: req.user });
  }
  res.status(401).json({ message: "Not logged in" });
});

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next(); // User is authenticated
  }
  return res
    .status(401)
    .json({ message: "User must be logged in to perform this action" });
};

// Protect cart route
app.post("/api/cart", ensureAuthenticated, (req, res) => {
  const { pizzaId, quantity } = req.body;
  const userId = req.user.id; // Get user ID from session

  // Logic to add pizza to cart
  console.log(
    `Adding pizza ${pizzaId} with quantity ${quantity} for user ${userId}`
  );
  res.json({ success: true });
});

app.get("/api/menu", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM menu_items");
    const menuItems = result.rows.map((item) => ({
      ...item,
      price: Number(item.price), // Convert price to a number
    }));
    res.json(menuItems);
  } catch (err) {
    console.error("Error fetching menu items:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.use("/images", express.static(path.join(__dirname, "public/images")));

// User Registration
app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user already exists
    const existingUserQuery = "SELECT * FROM users WHERE email = $1";
    const existingUserResult = await pool.query(existingUserQuery, [email]);

    if (existingUserResult.rows.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into the database
    const insertUserQuery = `
            INSERT INTO users (email, password)
            VALUES ($1, $2) RETURNING id, email
        `;
    const newUserResult = await pool.query(insertUserQuery, [
      email,
      hashedPassword,
    ]);

    res.json({
      success: true,
      message: "User registered successfully",
      user: newUserResult.rows[0],
    });
  } catch (err) {
    console.error("Error during registration:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

//User Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const query = "SELECT * FROM users WHERE email = $1";
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    req.login(user, (err) => {
      // Call req.login to serialize the user
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: "Server error" });
      }

      console.log("User logged in and serialized:", user);
      res.json({ success: true, user: { id: user.id, email: user.email } });
    });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID:
        "176945514745-gp8g3c84tc9u6e580oa2tjrcis9qh8gk.apps.googleusercontent.com",
      clientSecret: "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",
      callbackURL: "/auth/google/callback",
      scope: ["email"], // Use only email and profile scopes
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value; // Extract email from profile

        // Check if the user already exists
        const query = "SELECT * FROM users WHERE email = $1";
        const result = await pool.query(query, [email]);

        if (result.rows.length === 0) {
          // User does not exist, insert a new user with a NULL password
          const insertQuery = `
                INSERT INTO users (email, password) 
                VALUES ($1, $2) RETURNING id, email
            `;
          const insertResult = await pool.query(insertQuery, [email, null]); // Password is null for Google users
          return done(null, insertResult.rows[0]);
        }

        // User exists, proceed with login
        return done(null, result.rows[0]);
      } catch (err) {
        console.error("Error during Google authentication:", err.message);
        done(err, null);
      }
    }
  )
);

// Facebook Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: "YOUR_FACEBOOK_APP_ID",
      clientSecret: "YOUR_FACEBOOK_APP_SECRET",
      callbackURL: "/auth/facebook/callback",
      profileFields: ["id", "emails", "name"],
    },
    (accessToken, refreshToken, profile, done) => {
      const email = profile.emails
        ? profile.emails[0].value
        : `${profile.id}@facebook.com`;
      const user = users.find((u) => u.email === email);
      if (!user) {
        users.push({ email });
      }
      return done(null, profile);
    }
  )
);

// Google Login Routes
app.get("/auth/google", passport.authenticate("google", { scope: ["email"] }));
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login.html" }),
  (req, res) => res.redirect("/menu.html")
);

// Facebook Login Routes
app.get(
  "/auth/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);
app.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/login.html" }),
  (req, res) => res.redirect("/menu.html")
);

app.get("/api/cart", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res
      .status(401)
      .json({ message: "User must be logged in to access the cart" });
  }

  try {
    const query = `
            SELECT 
                ci.id AS cart_item_id,
                ci.quantity,
                mi.name AS pizza_name,
                mi.description AS pizza_description,
                mi.image_url AS pizza_image,
                mi.price AS unit_price,
                (ci.quantity * mi.price) AS total_price
            FROM 
                cart_items ci
            JOIN 
                menu_items mi ON ci.pizza_id = mi.id
            WHERE 
                ci.user_id = $1
        `;
    const result = await pool.query(query, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching cart items:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/cart", async (req, res) => {
  console.log("Session:", req.session);
  console.log("User:", req.user);

  if (!req.isAuthenticated()) {
    return res
      .status(401)
      .json({ message: "User must be logged in to add items" });
  }

  const { pizzaId, quantity } = req.body;
  const userId = req.user.id; // Get user ID from session

  console.log(
    `Adding pizza ${pizzaId} with quantity ${quantity} for user ${userId}`
  );
  try {
    const query = `
            INSERT INTO cart_items (user_id, pizza_id, quantity)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, pizza_id) DO UPDATE
            SET quantity = cart_items.quantity + EXCLUDED.quantity
        `;
    await pool.query(query, [req.user.id, pizzaId, quantity]);
    res.json({ success: true, message: "Item added to cart" });
  } catch (err) {
    console.error("Error adding item to cart:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.put("/api/cart", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res
      .status(401)
      .json({ message: "User must be logged in to update the cart" });
  }

  const { pizzaId, quantity } = req.body;

  try {
    const query = `
            UPDATE cart_items
            SET quantity = $1
            WHERE user_id = $2 AND pizza_id = $3
        `;
    await pool.query(query, [quantity, req.user.id, pizzaId]);
    res.json({ success: true, message: "Cart updated successfully" });
  } catch (err) {
    console.error("Error updating cart:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.delete("/api/cart/:pizzaId", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res
      .status(401)
      .json({ message: "User must be logged in to remove items" });
  }

  const { pizzaId } = req.params;

  try {
    const query = "DELETE FROM cart_items WHERE user_id = $1 AND pizza_id = $2";
    await pool.query(query, [req.user.id, pizzaId]);
    res.json({ success: true, message: "Item removed from cart" });
  } catch (err) {
    console.error("Error removing item from cart:", err);
    res.status(500).json({ message: "Internal server error" });
  }
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
