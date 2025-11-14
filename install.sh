#!/bin/bash

echo "🎫 Installing Discord Transcript Viewer..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Navigate to transcript-web directory
cd transcript-web

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create transcripts directory if it doesn't exist
mkdir -p data/transcripts

# Set proper permissions
chmod 755 data
chmod 755 data/transcripts

echo "✅ Installation complete!"
echo ""
echo "🚀 To start the server:"
echo "   cd transcript-web"
echo "   npm start"
echo ""
echo "🌐 Server will be available at: http://localhost:3000"
echo "📄 View transcripts at: http://localhost:3000/transcript/{id}"
echo ""
echo "⚙️  To integrate with your Discord bot:"
echo "   1. Replace your closebutton.js with closebutton-web.js"
echo "   2. Set TRANSCRIPT_BASE_URL environment variable to your domain"
echo "   3. Restart your Discord bot"
