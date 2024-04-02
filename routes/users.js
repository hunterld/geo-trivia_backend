const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware')

// Registration endpoint
router.post('/register', async (req, res) => {
    try {
      // Destructure req.body to get username, password, email
      const { username, password, email } = req.body;
  
      // Check if user already exists
      const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      
      if (userExists.rows.length > 0) {
        return res.status(401).json({ message: "User already exists" });
      }
  
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const bcryptPassword = await bcrypt.hash(password, salt);
  
      // Insert new user into database
      const newUser = await db.query(
        'INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING *',
        [username, bcryptPassword, email]
      );
  
      // Return new user
      res.status(201).json(newUser.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });

// Login endpoint
router.post('/login', async (req, res) => {
    try {
      // Destructure req.body to get email and password
      const { email, password } = req.body;
  
      // Check if user exists
      const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  
      if (user.rows.length === 0) {
        return res.status(401).json({ message: "Invalid Credentials" });
      }
  
      // Check if entered password is correct
      const validPassword = await bcrypt.compare(password, user.rows[0].password);
  
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid Credentials" });
      }
  
      // Create JWT token
      const token = jwt.sign({ user_id: user.rows[0].user_id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
  
      // Return token and user info
      res.json({ token, user: user.rows[0] });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });

  // Fetch user information endpoint
  // Fetch user information endpoint
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // Assuming you have middleware that correctly populates req.user with the authenticated user's data
    const user_id = req.user.user_id; // Make sure this matches how you're setting req.user in your auth middleware

    // Query to get the user's information
    const userData = await db.query('SELECT username, email, score FROM users WHERE user_id = $1', [user_id]);

    if (userData.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(userData.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Fetch user statistics endpoint
router.get('/me/stats', authMiddleware, async (req, res) => {
  try {
    // Authentication logic to get user ID
    const user_id = req.user.user_id;

    // Calculate the high score and the total number of games played
    const highScoreQuery = `
      SELECT 
        MAX(score) AS high_score,
        COUNT(*) AS games_played
      FROM game_statistics 
      WHERE user_id = $1
      GROUP BY user_id;
    `;

    // Execute the query
    const queryResult = await db.query(highScoreQuery, [user_id]);

    // If stats for the user are found, return them, otherwise return defaults
    if (queryResult.rows.length > 0) {
      res.json(queryResult.rows[0]);
    } else {
      res.json({
        high_score: 0,
        games_played: 0
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});


module.exports = router;
