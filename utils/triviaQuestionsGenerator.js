const pool = require('../db');
const fetch = require('node-fetch'); 

// Function to fetch capital cities from database
async function fetchCapitalCitiesFromDB() {
  const response = await pool.query('SELECT * FROM capitals');
  return response.rows;
}

function getRandomElements(arr, count) {
  const shuffled = arr.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Function to determine the difficulty of a question based on the country
function determineDifficulty(countryName) {
  // Define your mappings for easy, medium, and hard countries
  const easyCountries = ["Argentina", "Australia", "Austria", "Bahamas", "Belgium", "Brazil", "Canada", "Chile","China","Colombia", "Czech Republic", "Denmark", "Dominican Republic", "Egypt", "Finland", "France", "Germany","Greece", "Hungary", "India", "Ireland", "Israel", "Italy", "Japan", "Jamaica", "Kuwait", "Lebanon", "Libya", "Luxembourg", "Malaysia", "Mexico", "Monaco", "Nepal", "Netherlands","Pakistan","Panama","Philippines", "Poland", "Portugal", "Russia", "Saudi Arabia", "Serbia", "Spain", "Sweden", "Syria","Taiwan", "Thailand", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Vatican City"];
  const mediumCountries = ["Barbados", "Belarus", "Belize", "Bolivia", "Costa Rica", "Croatia", "Cuba", "Ecuador", "El Salvador", "Fiji", "Grenada", "Guatemala", "Haiti", "Honduras", "Jordan", "Iceland", "Indonesia", "Iran", "Iraq", "Kenya", "Latvia", "Morocco", "Mozambique", " Nepal", "Nicaragua", "Nigeria", "Norway", "New Zealand", "North Korea", "Oman", "Palestine", "Peru", "Portugal", "Qatar", "Romania", "Rwanda", "Scotland", "Senegal", "Singapore", "Slovakia", "Somalia", "South Africa", "South Korea", "Switzerland", " Turkey", "Uruguay", "Venezuela", "Vietnam", "Yemen", "Zimbabwe"];
  
  if (easyCountries.includes(countryName)) {
    return 'Easy';
  } else if (mediumCountries.includes(countryName)) {
    return 'Medium';
  } else {
    return 'Hard';
  }
}

async function generateTriviaQuestions() {
  const capitalCities = await fetchCapitalCitiesFromDB();
  console.log(capitalCities)
  const triviaQuestions = [];

  for (const capitalCity of capitalCities) {
    const countryDifficulty = determineDifficulty(capitalCity.country);
    const distractors = getRandomElements(
      capitalCities.filter(city => city.capital !== capitalCity.capital),
      3
    ).map(city => city.capital);

    console.log(`Distractors for ${capitalCity.country}:`, distractors);

    const multipleChoiceQuestion = {
      question_text: `What is the capital of ${capitalCity.country}?`,
      correct_answer: capitalCity.capital,
      incorrect_answers: distractors,
      category: 'Geography',
      difficulty: countryDifficulty, 
      question_type: 'multiple-choice',
      latitude: capitalCity.latitude,
      longitude: capitalCity.longitude 
    };

    triviaQuestions.push(multipleChoiceQuestion);

    // Generate fill-in-the-blank question
    const fillInTheBlankQuestion = {
      question_text: `Enter the capital of ${capitalCity.country}: _________`,
      correct_answer: capitalCity.capital,
      incorrect_answers: [], // No distractors for fill-in-the-blank
      category: 'Geography',
      difficulty: countryDifficulty, 
      question_type: 'fill-in-the-blank'
    };
     
    triviaQuestions.push(fillInTheBlankQuestion);
  }

  return triviaQuestions;
}

module.exports = { generateTriviaQuestions };


