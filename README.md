# Real-Time Chat Application

A modern, responsive real-time chat application built with React, Node.js, Firebase, and Socket.io.

## Features

### 🔐 Authentication
- Firebase Authentication with email/password and Google OAuth
- JWT token-based session management
- Secure user registration and login

### 💬 Real-Time Messaging
- Instant message delivery with Socket.io
- Typing indicators
- Message reactions (emojis)
- Message editing and deletion
- Read receipts
- Message replies

### 🏠 Chat Rooms
- Create public and private chat rooms
- Join public rooms
- Room member management
- Room admin controls
- Room descriptions and member limits

### 👥 User Management
- User profiles with display names and avatars
- Online/offline status indicators
- Last seen timestamps
- User search and discovery

### 🎨 Modern UI/UX
- Responsive design with TailwindCSS
- Dark/light theme support
- Mobile-first approach
- Smooth animations and transitions
- Intuitive navigation

### 🔧 Technical Features
- MongoDB for data persistence
- Real-time updates with Socket.io
- RESTful API with Express.js
- React Query for state management
- Optimistic updates for better UX

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TailwindCSS** - Styling
- **Socket.io Client** - Real-time communication
- **Firebase** - Authentication
- **React Query** - Data fetching and caching
- **React Router** - Navigation
- **React Hot Toast** - Notifications
- **Date-fns** - Date formatting

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.io** - Real-time communication
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Helmet** - Security middleware

## Prerequisites

Before running this application, make sure you have the following installed:

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd realtime-chat-app
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   npm install

   # Install client dependencies
   cd client
   npm install
   cd ..
   ```

3. **Environment Setup**

   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/realtime-chat

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

   # Firebase Configuration
   FIREBASE_API_KEY=your-firebase-api-key
   FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   FIREBASE_APP_ID=your-app-id

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

   Create a `.env` file in the client directory:
   ```env
   REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   REACT_APP_FIREBASE_APP_ID=your-app-id
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_SOCKET_URL=http://localhost:5000
   ```

4. **Firebase Setup**

   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication with Email/Password and Google providers
   - Copy your Firebase configuration to the environment variables

5. **MongoDB Setup**

   - Install and start MongoDB
   - Create a database named `realtime-chat`
   - Update the `MONGODB_URI` in your `.env` file

## Running the Application

### Development Mode

1. **Start the server**
   ```bash
   npm run server
   ```

2. **Start the client** (in a new terminal)
   ```bash
   npm run client
   ```

3. **Or run both simultaneously**
   ```bash
   npm run dev
   ```

### Production Mode

1. **Build the client**
   ```bash
   npm run build
   ```

2. **Start the server**
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/online-users` - Get online users

### Chat Rooms
- `GET /api/chat/rooms` - Get user's rooms
- `GET /api/chat/public-rooms` - Get public rooms
- `POST /api/chat/rooms` - Create new room
- `GET /api/chat/rooms/:roomId` - Get room details
- `POST /api/chat/rooms/:roomId/join` - Join room
- `POST /api/chat/rooms/:roomId/leave` - Leave room

### Messages
- `GET /api/chat/rooms/:roomId/messages` - Get room messages
- `POST /api/chat/rooms/:roomId/messages` - Send message
- `PUT /api/chat/messages/:messageId` - Edit message
- `DELETE /api/chat/messages/:messageId` - Delete message
- `POST /api/chat/messages/:messageId/reactions` - Add reaction
- `DELETE /api/chat/messages/:messageId/reactions` - Remove reaction

## Socket.io Events

### Client to Server
- `join_room` - Join a chat room
- `leave_room` - Leave a chat room
- `send_message` - Send a message
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `add_reaction` - Add reaction to message
- `remove_reaction` - Remove reaction from message
- `edit_message` - Edit a message
- `delete_message` - Delete a message
- `status_change` - Change user status

### Server to Client
- `new_message` - New message received
- `message_edited` - Message was edited
- `message_deleted` - Message was deleted
- `message_reaction_added` - Reaction was added
- `message_reaction_removed` - Reaction was removed
- `user_typing` - User started typing
- `user_stopped_typing` - User stopped typing
- `user_joined_room` - User joined room
- `user_left_room` - User left room
- `user_status_change` - User status changed

## Project Structure

```
realtime-chat-app/
├── server/                 # Backend code
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── socket/            # Socket.io handlers
│   └── index.js           # Server entry point
├── client/                # Frontend code
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── config/        # Configuration files
│   │   ├── hooks/         # Custom hooks
│   │   └── App.js         # Main app component
│   ├── public/            # Static files
│   └── package.json       # Client dependencies
├── package.json           # Server dependencies
└── README.md             # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please:

1. Check the [Issues](https://github.com/yourusername/realtime-chat-app/issues) page
2. Create a new issue with detailed information
3. Contact the maintainers

## Acknowledgments

- [React](https://reactjs.org/) for the amazing UI framework
- [Socket.io](https://socket.io/) for real-time communication
- [Firebase](https://firebase.google.com/) for authentication
- [TailwindCSS](https://tailwindcss.com/) for the beautiful styling
- [MongoDB](https://www.mongodb.com/) for the database