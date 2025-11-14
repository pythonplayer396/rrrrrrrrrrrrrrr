const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

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

// Set view engine for transcripts
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files for transcript viewer
app.use('/static', express.static(path.join(__dirname, 'public')));

// Keep-alive endpoint
app.get('/', (req, res) => {
    res.send(`
        <h1>🤖 FakePixel Discord Bot</h1>
        <p>✅ Bot is alive and running!</p>
        <p>🎫 Transcript viewer available at <a href="/transcript">/transcript/{id}</a></p>
        <p>📊 Server status: Online</p>
    `);
});

// Import and use transcript routes
try {
    const transcriptRoutes = require('./server/routes/transcript');
    app.use('/', transcriptRoutes);
} catch (error) {
    console.log('⚠️  Transcript routes not available:', error.message);
}

// 404 handler
app.use((req, res) => {
    if (req.path.startsWith('/transcript/')) {
        res.status(404).send(`
            <h1>🎫 Transcript Not Found</h1>
            <p>The requested transcript does not exist or has been removed.</p>
            <a href="/">← Back to Home</a>
        `);
    } else {
        res.status(404).send(`
            <h1>404 - Page Not Found</h1>
            <p>The requested page does not exist.</p>
            <a href="/">← Back to Home</a>
        `);
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).send(`
        <h1>500 - Server Error</h1>
        <p>An internal server error occurred.</p>
        <a href="/">← Back to Home</a>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 FakePixel Bot Server running on port ${PORT}`);
    console.log(`📝 Transcript viewer: http://localhost:${PORT}/transcript/{id}`);
});