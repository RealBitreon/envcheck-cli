const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

app.use(express.json());
app.use(require('./middleware/cors'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: NODE_ENV });
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});

module.exports = app;
