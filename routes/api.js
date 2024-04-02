const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

router.get('/search', async (req, res) => {
  const searchTerm = req.query.q; 
  const username = 'hunted1ne'; 
  const url = `http://api.geonames.org/searchJSON?formatted=true&q=${searchTerm}&maxRows=10&username=${username}&style=full`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('GeoNames API response:', data); // Add this line to log the API response
    if (data.geonames && data.geonames.length > 0) {
      res.json(data.geonames);
    } else {
      res.status(404).json({ message: 'No results found' });
    }
  } catch (error) {
    console.error('GeoNames API request failed:', error);
    res.status(500).send('Server error');
  }
});

module.exports = router;

