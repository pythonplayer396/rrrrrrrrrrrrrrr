const express = require('express');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const router = express.Router();

// Home route
router.get('/', (req, res) => {
  res.render('index', {
    title: 'Discord Transcript Viewer',
    message: 'Enter a transcript ID to view the conversation'
  });
});

// View transcript
router.get('/transcript/:id', async (req, res) => {
  try {
    const transcriptId = req.params.id;
    const transcriptPath = path.join(__dirname, '../../data/transcripts', `${transcriptId}.json`);
    
    // Check if transcript exists
    if (!fs.existsSync(transcriptPath)) {
      return res.status(404).render('error', {
        error: 'Transcript Not Found',
        message: `Transcript with ID "${transcriptId}" does not exist or has been removed.`
      });
    }
    
    // Read and parse transcript
    const transcriptData = JSON.parse(fs.readFileSync(transcriptPath, 'utf8'));
    
    // Process messages for display
    const processedMessages = transcriptData.messages.map(msg => ({
      ...msg,
      timestamp: moment(msg.timestamp).format('MM/DD/YYYY h:mm A'),
      timestampTooltip: moment(msg.timestamp).format('dddd, MMMM Do YYYY [at] h:mm:ss A'),
      isBot: msg.author.bot || false,
      isSystem: msg.type === 'system' || msg.author.id === 'system'
    }));
    
    res.render('transcript', {
      transcript: {
        ...transcriptData,
        messages: processedMessages,
        createdAt: moment(transcriptData.createdAt).format('MMMM Do YYYY [at] h:mm A'),
        closedAt: transcriptData.closedAt ? moment(transcriptData.closedAt).format('MMMM Do YYYY [at] h:mm A') : null
      }
    });
    
  } catch (error) {
    console.error('Error loading transcript:', error);
    res.status(500).render('error', {
      error: 'Error Loading Transcript',
      message: 'There was an error loading the transcript. Please try again later.'
    });
  }
});

// API endpoint to get transcript data (for future integrations)
router.get('/api/transcript/:id', (req, res) => {
  try {
    const transcriptId = req.params.id;
    const transcriptPath = path.join(__dirname, '../../data/transcripts', `${transcriptId}.json`);
    
    if (!fs.existsSync(transcriptPath)) {
      return res.status(404).json({ error: 'Transcript not found' });
    }
    
    const transcriptData = JSON.parse(fs.readFileSync(transcriptPath, 'utf8'));
    res.json(transcriptData);
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
