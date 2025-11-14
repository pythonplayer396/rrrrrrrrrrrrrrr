const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const transcriptRoutes = require('./routes/transcript');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      scriptSrc: ["'self'"]
    }
  }
}));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Static files
app.use('/static', express.static(path.join(__dirname, '../public')));

// Routes
app.use('/', transcriptRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { 
    error: 'Transcript not found',
    message: 'The requested transcript does not exist or has been removed.'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).render('error', {
    error: 'Server Error',
    message: 'An internal server error occurred.'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Discord Transcript Server running on port ${PORT}`);
  console.log(`📝 View transcripts at: http://localhost:${PORT}/transcript/{id}`);
});
