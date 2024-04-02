const express = require('express');
const db = require('../db'); 
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

// Whitelisted values for difficulty and question type
const validDifficulties = ['Easy', 'Medium', 'Hard'];
const validQuestionTypes = ['multiple-choice', 'fill-in-the-blank', 'true-false', 'any'];

// Function to generate a True or False question
async function generateTrueFalseQuestion() {
  try {
    // Get a random true/false question from the trivia_questions table
    const { rows: questions } = await db.query(`
      SELECT id, question_text, correct_answer, latitude, longitude
      FROM trivia_questions 
      WHERE question_type = 'true-false'
      ORDER BY RANDOM() 
      LIMIT 1
    `);
    
    const question = questions[0];
    if (!question) {
      return { error: 'No true/false question available.' };
    }
    
    // Return the question along with the necessary properties
    return {
      id: question.id,
      question_text: question.question_text,
      answer: question.correct_answer, 
      latitude: question.latitude,
      longitude: question.longitude
    };
  } catch (err) {
    console.error('Error fetching true/false question:', err);
    throw err;
  }
}

// Helper function to validate against the whitelist
const isValidValue = (value, validList) => validList.includes(value);

// Endpoint to get a true/false question directly
router.get('/true-false-question', async (req, res) => {
  try {
    const question = await generateTrueFalseQuestion();
    if (question.error) {
      res.status(404).json({ error: question.error });
    } else {

      res.json({
        id: question.id,
        question_text: question.question_text,
        answer: question.answer,
        latitude: question.latitude,
        longitude: question.longitude
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to submit an answer
router.post('/answer', authMiddleware, async (req, res) => {
  console.log("Received answer submission: ", req.body);
  const userId = req.user.user_id;
  const { questionId, isCorrect } = req.body;

  // Retrieve the question details including latitude and longitude
  const { rows: questionDetails } = await db.query('SELECT latitude, longitude FROM trivia_questions WHERE id = $1', [questionId]);
  if (!questionDetails.length) {
    return res.status(404).json({ error: "Question not found." });
  }

  const { latitude, longitude } = questionDetails[0];

  // Validation to check if userId and questionId are not null
  if (!userId || !questionId) {
    return res.status(400).json({ error: "Missing user ID or question ID in the request body." });
  }

  try {
    const insertQuery = `
      INSERT INTO answered_questions (user_id, question_id, correct, latitude, longitude)
      VALUES ($1, $2, $3, $4, $5)`;
    await db.query(insertQuery, [userId, questionId, isCorrect, latitude, longitude]);
    res.json({ message: 'Answer recorded successfully' });
  } catch (error) {
    console.error('Error recording answer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to fetch heatmap data
router.get('/heatmap-data', async (req, res) => {
  try {
    const queryText = `
      SELECT latitude, longitude, COUNT(*) AS weight, correct AS isCorrect
      FROM answered_questions
      GROUP BY latitude, longitude, correct`;
    const { rows } = await db.query(queryText);
    // Include isCorrect in the map
    const heatmapData = rows.map(row => ({
      latitude: row.latitude,
      longitude: row.longitude,
      weight: row.weight,
      isCorrect: row.iscorrect 
    }));
    res.json(heatmapData);
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a random trivia question with optional filters for difficulty and question_type
router.get('/random', async (req, res) => {
  const { difficulty, question_type, exclude } = req.query;
  let queryParams = [];
  let queryText = 'SELECT * FROM trivia_questions WHERE true';

  // Handle difficulty
  if (difficulty && isValidValue(difficulty, validDifficulties)) {
    queryParams.push(difficulty);
    queryText += ` AND difficulty = $${queryParams.length}`;
  }

  // Handle 'any' question type with a chance for true/false question
  if (question_type === 'any') {
    if (Math.random() < 0.5) {
      const question = await generateTrueFalseQuestion();
      res.json(question);
      return;
    } else {
      // Exclude 'true-false' from the types and randomly select another type
      const typesWithoutTrueFalse = validQuestionTypes.filter(type => type !== 'true-false' && type !== 'any');
      const randomType = typesWithoutTrueFalse[Math.floor(Math.random() * typesWithoutTrueFalse.length)];
      queryParams.push(randomType);
      queryText += ` AND question_type = $${queryParams.length}`;
    }
  } else if (isValidValue(question_type, validQuestionTypes)) {
    queryParams.push(question_type);
    queryText += ` AND question_type = $${queryParams.length}`;
  }

  // Exclude already asked questions if any
  if (exclude) {
    const excludeIds = exclude.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
    if (excludeIds.length > 0) {
      queryParams.push(excludeIds);
      queryText += ` AND id != ALL($${queryParams.length})`;
    }
  }

  queryText += ' ORDER BY RANDOM() LIMIT 1';

  try {
    const { rows } = await db.query(queryText, queryParams);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(200).json({ message: 'No new questions available. You have answered all of them!' });
    }
  } catch (error) {
    console.error('Error fetching trivia question:', error);
    res.status(500).send('Server error');
  }
});

router.post('/end-game', authMiddleware, async (req, res) => {
  const { userId, score, totalQuestions, correctAnswers, incorrectAnswers } = req.body;

  try {
    // Start a transaction
    await db.query('BEGIN');

    // Update game statistics
    const gameStatsQuery = `
      INSERT INTO game_statistics (user_id, score, total_questions, correct_answers, incorrect_answers)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING game_id;`;
    const gameStatsRes = await db.query(gameStatsQuery, [userId, score, totalQuestions, correctAnswers, incorrectAnswers]);
    
    // Update the user's total score in the 'users' table
    const userScoreUpdateQuery = `
      UPDATE users
      SET score = score + $2
      WHERE user_id = $1;`;
    await db.query(userScoreUpdateQuery, [userId, score]);
    
    // Commit the transaction
    await db.query('COMMIT');
    
    res.json({ game_id: gameStatsRes.rows[0].game_id, message: 'Game ended and score recorded successfully.' });
  } catch (error) {
    // If there's an error, rollback any changes
    await db.query('ROLLBACK');
    
    // Log the error and send a server error response
    console.error('Error ending game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

