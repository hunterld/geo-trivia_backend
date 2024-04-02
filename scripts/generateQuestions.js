const { generateTriviaQuestions } = require('../utils/triviaQuestionsGenerator');
const pool = require('../db');

async function fetchAndPopulateQuestions() {
  try {
    const triviaQuestions = await generateTriviaQuestions();

    for (const question of triviaQuestions) {
      // Insert the question into the database, including distractors
      await pool.query(
        `INSERT INTO trivia_questions 
        (question_text, correct_answer, incorrect_answers, category,  question_type, difficulty) 
        VALUES ($1, $2, $3::text[], $4, $5, $6)
        ON CONFLICT (question_text, correct_answer) 
        DO UPDATE SET 
          incorrect_answers = EXCLUDED.incorrect_answers, 
          difficulty = EXCLUDED.difficulty, 
          question_type = EXCLUDED.question_type
        `,
        [
          question.question_text,
          question.correct_answer,
          question.incorrect_answers, 
          'Geography',
          question.question_type,
          question.difficulty           
        ]
      );
    }

    console.log('Trivia questions have been generated and stored.'); 
  } catch (error) {
    console.error('Error fetching and populating questions:', error);
  }
}

fetchAndPopulateQuestions();


