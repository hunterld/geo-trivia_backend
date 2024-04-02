const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/authMiddleware');

// Post game statistics
router.post('/', auth, async (req, res) => {
    try {
        const { user_id, score, total_questions, correct_answers, incorrect_answers } = req.body;
        const newStatistics = await db.query(
            'INSERT INTO game_statistics (user_id, score, total_questions, correct_answers, incorrect_answers) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [user_id, score, total_questions, correct_answers, incorrect_answers]
        );
        res.status(201).json(newStatistics.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Get statistics for a user
router.get('/:userId', auth, async (req, res) => {
    try {
        const { userId } = req.params;
        const statistics = await db.query(
            'SELECT * FROM game_statistics WHERE user_id = $1',
            [userId]
        );
        res.json(statistics.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
