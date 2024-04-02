const axios = require('axios');
const pool = require('../db'); 

async function fetchUSStateCapitals() {
  try {
    // Use GeoNames API to fetch US states and capitals
    const { data } = await axios.get('http://api.geonames.org/childrenJSON?geonameId=6252001&username=hunted1ne');
    if (!data.geonames) {
      throw new Error("Failed to fetch US state capitals");
    }
    return data.geonames.map(stateInfo => ({
      state: stateInfo.adminName1,
      capital: stateInfo.toponymName,
      latitude: stateInfo.lat,
      longitude: stateInfo.lng
    }));
  } catch (error) {
    console.error('Error fetching US state capitals:', error);
    return [];
  }
}

async function generateAndInsertQuestions() {
  const stateCapitals = await fetchUSStateCapitals();
  
  
  const shuffledCapitals = stateCapitals.sort(() => 0.5 - Math.random());

  for (const { state, capital, latitude, longitude } of stateCapitals) {
    
    // Choose 3 random capitals as incorrect answers
    const incorrectAnswers = shuffledCapitals.filter(item => item.capital !== capital)
                                               .slice(0, 3)
                                               .map(item => item.capital);

    // Construct question and insert into the database
    try {
      await pool.query(`
        INSERT INTO trivia_questions 
          (question_text, correct_answer, incorrect_answers, category, question_type, difficulty, latitude, longitude) 
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (question_text) DO NOTHING;`, 
        [
          `What is the capital of ${state}?`,
          capital,
          JSON.stringify(incorrectAnswers),
          'US State Capitals',
          'multiple-choice',
          'Easy',
          latitude,
          longitude
        ]
      );
      console.log(`Inserted question for: ${state}`);
    } catch (error) {
      console.error(`Failed to insert question for ${state}:`, error);
    }
  }
}

generateAndInsertQuestions();
