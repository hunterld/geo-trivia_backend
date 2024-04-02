const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Geo Trivia Game Backend Running');
});

app.get('/geonames/search', async (req, res) => {
  const query = req.query.q; 
  const cacheKey = `geonames-${query}`; // Unique key for caching

  // Check if data for this query is already in cache
  const cachedData = myCache.get(cacheKey);

  if (cachedData) {
    // If data is in cache, send it back to the client
    return res.json(cachedData);
  }

  const username = 'hunted1ne'; 
  const url = `http://api.geonames.org/searchJSON?formatted=true&q=${query}&maxRows=10&username=${username}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Save the data in cache before sending the response
    myCache.set(cacheKey, data.geonames);

    res.json(data.geonames); // Send the GeoNames data back to the client
  } catch (error) {
    console.error('GeoNames API request failed:', error);
    res.status(500).send('Server error');
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

module.exports = myCache;