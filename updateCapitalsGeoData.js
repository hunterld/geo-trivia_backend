const fetch = require('node-fetch'); 
const pool = require('./db');

async function fetchGeoDataForCity(cityName) {
  const API_URL = `http://api.geonames.org/searchJSON?formatted=true&q=${cityName}&maxRows=1&username=hunted1ne`;
 
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    const cityInfo = data.geonames[0];
    return {
      latitude: cityInfo.lat,
      longitude: cityInfo.lng
    };
  } catch (error) {
    console.error(`Failed to fetch geo data for city: ${cityName}`, error);
    throw error;
  }
}

async function updateTriviaQuestionsWithGeoData() {
  try {
    const { rows: triviaQuestions } = await pool.query('SELECT id, correct_answer FROM trivia_questions');
    for (const question of triviaQuestions) {
      const geoData = await fetchGeoDataForCity(question.correct_answer); // Assuming correct_answer contains the capital name
      await pool.query('UPDATE trivia_questions SET latitude = $1, longitude = $2 WHERE id = $3',
        [geoData.latitude, geoData.longitude, question.id]
      );
      console.log(`Updated question id ${question.id} with lat: ${geoData.latitude}, long: ${geoData.longitude}`);
    }
    console.log('All trivia questions have been updated with geolocation data.');
  } catch (error) {
    console.error('An error occurred while updating trivia questions with geolocation data:', error);
  }
}

updateTriviaQuestionsWithGeoData();
