#!/bin/bash

echo "🚀 Setting up Real-time Chat Application..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install server dependencies
echo "📦 Installing server dependencies..."
npm install

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install
cd ..

echo "✅ Dependencies installed successfully!"

# Create environment files if they don't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp env.example .env
    echo "⚠️  Please update the .env file with your configuration"
fi

if [ ! -f client/.env ]; then
    echo "📝 Creating client .env file..."
    cat > client/.env << EOF
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
EOF
    echo "⚠️  Please update the client/.env file with your Firebase configuration"
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "Next steps:"
echo "1. Update .env and client/.env with your configuration"
echo "2. Start MongoDB"
echo "3. Run 'npm run dev' to start the application"
echo ""
echo "For more information, see the README.md file"