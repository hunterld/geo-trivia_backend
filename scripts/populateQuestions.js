// const { generateTriviaQuestions } = require('../utils/triviaQuestionsGenerator');
// const pool = require('../db');

// async function populateQuestions() {
//   console.log('Starting to populate questions...');
//   const triviaQuestions = await generateTriviaQuestions();

//   for (const question of triviaQuestions) {
//     console.log('Inserting question:', question.question_text);
//     console.log('Incorrect answers array:', question.incorrect_answers);
//     try {
//       await pool.query(`
//         INSERT INTO trivia_questions (
//           question_text, 
//           correct_answer, 
//           incorrect_answers, 
//           category, 
//           difficulty)
//         VALUES ($1, $2, $3, $4, $5)
//       `, [
//         question.question_text, 
//         question.correct_answer, 
//         question.incorrect_answers, 
//         question.category, 
//         question.difficulty
//       ]);
//       // Log the inserted question for debugging
//       console.log(`Inserted question with incorrect answers:`, question.incorrect_answers);
//     } catch (error) {
//       console.error('Error inserting question:', error);
//     }
//   }
//   console.log('Trivia questions have been generated and stored.');
// }


// populateQuestions();

/*******TO BE DELETED */