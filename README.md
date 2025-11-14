# Discord Transcript Viewer

A Discord-like web interface for viewing ticket transcripts with exact Discord styling and functionality.

## Features

- **Discord-Accurate UI**: Pixel-perfect recreation of Discord's chat interface
- **Rich Content Support**: Messages, embeds, attachments, reactions
- **Responsive Design**: Works on desktop and mobile devices
- **Fast Loading**: Optimized for quick transcript viewing
- **Secure**: No external dependencies for core functionality

## Installation

1. Navigate to the transcript-web directory:
```bash
cd transcript-web
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

The server will run on `http://localhost:3000`

## Usage

### Viewing Transcripts
- Access transcripts at: `http://localhost:3000/transcript/{transcript-id}`
- API endpoint: `http://localhost:3000/api/transcript/{transcript-id}`

### Integration with Discord Bot

The transcript system integrates with your Discord bot by modifying the ticket close functionality to generate JSON transcripts instead of text files.

## File Structure

```
transcript-web/
├── server/
│   ├── app.js                    # Express server
│   ├── routes/transcript.js      # Transcript routes
│   └── utils/transcriptParser.js # Message processing
├── public/
│   ├── css/discord.css          # Discord styling
│   └── js/transcript.js         # Client interactions
├── views/
│   ├── transcript.ejs           # Main transcript view
│   ├── partials/
│   │   ├── embed.ejs           # Discord embed component
│   │   └── attachment.ejs       # File attachment component
│   └── error.ejs               # Error page
└── data/
    └── transcripts/            # JSON transcript storage
```

## Configuration

### Environment Variables
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode

### Security
The server includes:
- Helmet.js for security headers
- CORS protection
- Input validation
- File access restrictions

## Discord Bot Integration

To integrate with your existing Discord bot, modify your ticket close handler to use the `TranscriptParser` class:

```javascript
const TranscriptParser = require('./transcript-web/server/utils/transcriptParser');

// In your close button handler
const parser = new TranscriptParser();
const transcript = await parser.generateTranscript({
  messages: sortedMessages,
  channel: channel,
  guild: guild,
  closer: interaction.user,
  reason: reason,
  opener: opener
});

// Send transcript URL instead of file
const transcriptUrl = `https://your-domain.com${transcript.url}`;
```

## Deployment

### Local Development
```bash
npm run dev  # Uses nodemon for auto-restart
```

### Production
```bash
npm start
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## API Reference

### GET /transcript/:id
Returns the HTML transcript view

### GET /api/transcript/:id
Returns raw JSON transcript data

**Response Format:**
```json
{
  "id": "transcript-uuid",
  "channel": { "id": "...", "name": "...", "type": "..." },
  "guild": { "id": "...", "name": "...", "icon": "..." },
  "ticketInfo": { "opener": {...}, "closer": {...}, "reason": "..." },
  "messages": [...],
  "createdAt": "2023-...",
  "messageCount": 42
}
```

## Troubleshooting

### Common Issues

1. **Transcripts not loading**: Check file permissions in `data/transcripts/`
2. **Images not displaying**: Verify Discord CDN URLs are accessible
3. **Styling issues**: Clear browser cache and check CSS loading

### Logs
Server logs include:
- Transcript access attempts
- Error details
- Performance metrics

## License

MIT License - See LICENSE file for details
