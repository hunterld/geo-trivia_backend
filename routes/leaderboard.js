const express = require('express');
const router = express.Router();
const db = require('../db'); 

router.get('/', async (req, res) => {
  try {
    // SQL query to aggregate scores and group them by user_id
    const leaderboardQuery = `
      SELECT u.username, SUM(gs.score) AS total_score
      FROM game_statistics AS gs
      JOIN users AS u ON gs.user_id = u.user_id
      GROUP BY u.username
      ORDER BY total_score DESC
      LIMIT 10; 
    `;
    
    const { rows } = await db.query(leaderboardQuery);
    
    res.json(rows);
  } catch (err) {

    // Send back a generic server error message
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;



