const fetch = require('node-fetch');
const db = require('../db'); 

async function fetchAndStoreCapitals() {
  const url = 'http://api.geonames.org/countryInfoJSON?username=hunted1ne'; 

  try {
    const response = await fetch(url);
    const data = await response.json();

    for (const country of data.geonames) {
      const capital = country.capital;
      const countryName = country.countryName;

      await db.query(
        'INSERT INTO capitals (country, capital) VALUES ($1, $2) ON CONFLICT (country) DO UPDATE SET capital = EXCLUDED.capital',
        [countryName, capital]
      );
    }
    console.log('Capitals have been fetched and stored.');
  } catch (error) {
    console.error('Error fetching capital cities:', error);
  }
}

fetchAndStoreCapitals();
