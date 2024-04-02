const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization');
    console.log('Auth Header:', token);

    if (!token) {
      return res.status(401).send({ message: 'No authentication token, authorization denied.' });
    }

    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).send({ message: 'Token is not valid.' });
  }
};

module.exports = auth;


