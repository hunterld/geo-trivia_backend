const express = require('express');
const authMiddleware = require('./middleware/authMiddleware');
const app = express();
const helmet = require('helmet');
const cors = require('cors');
const geonamesRoutes = require('./routes/api.js');
const questionRoutes = require('./routes/questions'); 
const userRoutes = require('./routes/users'); 
const statisticsRoutes = require('./routes/statistics');
const triviaRoutes = require('./routes/trivia');
const leaderboardRoutes = require('./routes/leaderboard');

require('dotenv').config();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/api/geonames', geonamesRoutes);
app.use('/api/questions', questionRoutes); 
app.use('/api/users', userRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/trivia', triviaRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

const privateRouteHandler = (req, res) => {
  res.send('This is a private route that requires authentication.');
};

app.use('/api/private-route', authMiddleware, privateRouteHandler);

app.get('/', (req, res) => {
  res.json({ message: 'Geo Trivia Game Backend Running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
