const axios = require('axios');
const pool = require('../db');

const GEO_USERNAME = 'hunted1ne'; 

async function fetchAndPopulate() {
  try {
    // Fetching country list from GeoNames
    const { data: countries } = await axios.get(`http://api.geonames.org/countryInfoJSON?username=hunted1ne`);

    for (let country of countries.geonames) {
      // Fetch capital's geo data
      const { data: capitalGeo } = await axios.get(`http://api.geonames.org/searchJSON?q=${country.capital}&maxRows=1&username=hunted1ne`);
      
      if (capitalGeo.geonames.length > 0) {
        const capitalInfo = capitalGeo.geonames[0];

        // Construct the question
        const questionText = `Is ${capitalInfo.toponymName} the capital of ${country.countryName}?`;
        const correctAnswer = 'true'; 
        const category = 'Geography';
        const difficulty = 'Easy'; 
        const questionType = 'true-false';
        const latitude = capitalInfo.lat;
        const longitude = capitalInfo.lng;

        // Insert into the database
        await pool.query(
          'INSERT INTO trivia_questions (question_text, correct_answer, category, question_type, difficulty, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [questionText, correctAnswer, category, questionType, difficulty, latitude, longitude]
        );

        console.log(`Inserted: ${questionText}`);
      }
    }
  } catch (error) {
    console.error('Error in fetchAndPopulate:', error);
  }
}

fetchAndPopulate();
