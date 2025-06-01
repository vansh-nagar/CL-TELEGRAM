# CL-TELEGRAM

A full-stack real-time chat application with video calling functionality, inspired by Telegram. Built using React.js, Node.js, Express, MongoDB, Socket.io, and WebRTC.

## 🚀 Features

- 🧑‍💬 Real-time one-on-one messaging
- 📡 WebSocket-based communication using `socket.io`
- 📁 Persistent chat history stored in MongoDB
- ✅ Offline message delivery (stored and synced when receiver comes online)
- 🎥 Peer-to-peer video calling using WebRTC
- 📱 Responsive UI using React
- 🔐 (Coming soon) JWT Authentication for secure login/signup
- 🌐 User status: online/offline tracking

---

## 🛠️ Tech Stack

### Frontend
- React.js
- CSS / Tailwind (if applied)
- Socket.io-client
- WebRTC APIs

### Backend
- Node.js
- Express
- MongoDB with Mongoose
- Socket.io (for real-time)
- CORS, dotenv

---

## 📦 Installation

### Clone the repo

```bash
git clone https://github.com/vansh-nagar/CL-TELEGRAM.git
cd CL-TELEGRAM
```
```
##backend seup
cd backend
npm install
npm run dev
```

will add env

```
cd ../frontend
npm install
npm start
```


🛣️ API Routes in backend/routes/
📁 authRoutes.js
Handles user authentication.

Method	Route	Description
POST	/api/auth/register	Register a new user
POST	/api/auth/login	Login existing user

📁 messageRoute.js
Manages message sending and retrieval.

Method	Route	Description
POST	/api/message	Send a new message
GET	/api/message/:id	Get all messages for a user/chat

📁 userRoute.js
Handles user-related actions.

Method	Route	Description
GET	/api/user	Get all users
GET	/api/user/:id	Get a single user by ID

✅ Summary of Backend Entry
All routes are prefixed under /api/

You're using Express.Router() modules cleanly for each domain (auth, user, message)

Message persistence and user lookup are handled with clear endpoints
