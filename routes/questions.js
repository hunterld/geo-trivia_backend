const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/authMiddleware');

// Helper function to format a question
function formatQuestion(questionRow) {
  return {
    question_id: questionRow.id, 
    question_text: questionRow.question_text,
    correct_answer: questionRow.correct_answer,
    incorrect_answers: questionRow.incorrect_answers,
    category: questionRow.category,
    difficulty: questionRow.difficulty, 
    question_type: questionRow.question_type
  };
}

// Get all questions with filters for question type and difficulty level
router.get('/random', async (req, res) => {
  const { question_type, difficulty } = req.query;

  // A list of valid difficulties and question types
  const validDifficulties = ['Easy', 'Medium', 'Hard'];
  const validQuestionTypes = ['multiple-choice', 'fill-in-the-blank'];

  let queryText = 'SELECT * FROM trivia_questions WHERE true';
  const queryParams = [];

  // Append difficulty condition to the query if it's provided and valid
  if (difficulty && validDifficulties.includes(difficulty)) {
    queryParams.push(difficulty);
    queryText += ` AND difficulty = $${queryParams.length}`;
  }

  // Append question_type condition to the query if it's provided and valid
  if (question_type && validQuestionTypes.includes(question_type)) {
    queryParams.push(question_type);
    queryText += ` AND question_type = $${queryParams.length}`;
  }

  queryText += ' ORDER BY RANDOM() LIMIT 1'; 

  try {
    const { rows } = await db.query(queryText, queryParams);
    if (rows.length > 0) {
      const formattedQuestion = formatQuestion(rows[0]); 
      res.json(formattedQuestion); 
    } else {
      res.status(404).json({ message: 'No matching questions found' });
    }
  } catch (error) {
    console.error('Error fetching random question with filters:', error);
    res.status(500).send('Server error');
  }
});

  // Update a question
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { question_text, correct_answer, category, difficulty, question_type } = req.body;
    const updateQuestion = await db.query(
      'UPDATE trivia_questions SET question_text = $1, correct_answer = $2, category = $3, difficulty = $4, question_type = $5 WHERE id = $6 RETURNING *',
      [question_text, correct_answer, category, difficulty, question_type, id]
    );
    if (updateQuestion.rows.length === 0) {
      return res.status(404).json({ message: "This question doesn't exist." });
    }
    res.json(updateQuestion.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete a question
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const deleteQuestion = await db.query('DELETE FROM trivia_questions WHERE id = $1', [id]);
    if (deleteQuestion.rowCount === 0) {
      return res.status(404).json({ message: "This question doesn't exist." });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Route to get leaderboard data
router.get('/', async (req, res) => {
  try {
    const results = await db.query('SELECT username, score FROM users ORDER BY score DESC'); 
    res.json(results.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

  module.exports = router;