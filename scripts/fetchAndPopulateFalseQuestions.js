const axios = require('axios');
const pool = require('../db');

const GEO_USERNAME = 'hunted1ne';  // Replace with your GeoNames username.

async function fetchAndPopulateFalseQuestions() {
  try {
    // Fetching country list from GeoNames
    const { data: countriesData } = await axios.get(`http://api.geonames.org/countryInfoJSON?username=hunted1ne`);
    const countries = countriesData.geonames;

    // Shuffle countries to randomize the order
    const shuffledCountries = [...countries].sort(() => Math.random() - 0.5);

    // Create false questions
    for (let i = 0; i < countries.length; i++) {
      const randomIndex = Math.floor(Math.random() * shuffledCountries.length);
      const country = countries[i];
      const randomCapital = shuffledCountries[randomIndex].capital;

      // Avoid using the correct capital for the country
      if (country.capital !== randomCapital) {
        const questionText = `Is ${randomCapital} the capital of ${country.countryName}?`;
        const correctAnswer = 'false';

        // Insert the false question into the database
        await pool.query(
          'INSERT INTO trivia_questions (question_text, correct_answer, category, question_type, difficulty) VALUES ($1, $2, $3, $4, $5)',
          [questionText, correctAnswer, 'Geography', 'true-false', 'Easy']
        );

        console.log(`Inserted false question: ${questionText}`);
      }
    }
    console.log('False questions have been populated.');
  } catch (error) {
    console.error('Error in fetchAndPopulateFalseQuestions:', error);
  }
}

fetchAndPopulateFalseQuestions();

