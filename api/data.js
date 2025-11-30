const mongoose = require('mongoose');

// --- 1. CONFIGURATION ---
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) return;
  
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is undefined in Vercel Environment Variables.');
  }

  try {
    console.log("Attempting to connect to MongoDB...");
    // connect with options to prevent timeout issues
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Fail fast if IP is blocked
    });
    isConnected = true;
    console.log("Connected to MongoDB successfully");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
    // Throwing with specific message to help user debug
    if (err.name === 'MongooseServerSelectionError') {
      throw new Error('IP Address Blocked by MongoDB. Go to Network Access > Add IP > Allow 0.0.0.0/0');
    }
    throw err;
  }
};

// --- 2. SCHEMAS ---

// User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Room Schema
const RoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  pin: { type: String, required: true },
  targetDate: { type: Object, required: true },
  creatorId: String,
  members: [String],
  
  // App State
  stickers: { type: Array, default: [] },
  todoItems: { type: Array, default: ['Plan a cute date', 'Buy chocolates'] },
  noteState: { type: Object, default: { x: 0, y: 0, rotation: -2, scale: 1 } },
  redBubble: { type: String, default: '' },
  greenBubble: { type: String, default: '' },
  photo: { type: String, default: 'us.png' },
  customLibrary: { type: Array, default: [] },
  chatMessages: { type: Array, default: [] }
});

// Models
let User, Room;
try {
  User = mongoose.model('User');
  Room = mongoose.model('Room');
} catch {
  User = mongoose.model('User', UserSchema);
  Room = mongoose.model('Room', RoomSchema);
}

// --- 3. SERVERLESS HANDLER ---
module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Health Check (GET request)
  if (req.method === 'GET') {
     return res.status(200).json({ status: 'API is running' });
  }

  try {
    await connectToDatabase();
    const { action, payload } = req.body;

    // --- AUTH ROUTES ---
    if (action === 'REGISTER') {
      const { username, password } = payload;
      const existing = await User.findOne({ username });
      if (existing) return res.status(400).json({ error: 'Username taken' });
      const newUser = await User.create({ username, password });
      return res.status(200).json({ success: true, userId: newUser._id, username });
    }

    if (action === 'LOGIN') {
      const { username, password } = payload;
      const user = await User.findOne({ username, password });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      return res.status(200).json({ success: true, userId: user._id, username });
    }

    // --- ROOM ROUTES ---
    if (action === 'CREATE_ROOM') {
      const { roomId, pin, targetDate, creatorId } = payload;
      const existing = await Room.findOne({ roomId });
      if (existing) return res.status(400).json({ error: 'Room ID taken' });
      
      const newRoom = await Room.create({
        roomId,
        pin,
        targetDate,
        creatorId,
        members: [creatorId]
      });
      return res.status(200).json({ success: true, room: newRoom });
    }

    if (action === 'JOIN_ROOM') {
      const { roomId, pin, username } = payload;
      const room = await Room.findOne({ roomId });
      if (!room) return res.status(404).json({ error: 'Room not found' });
      if (room.pin !== pin) return res.status(403).json({ error: 'Invalid PIN' });
      
      if (!room.members.includes(username)) {
        room.members.push(username);
        await room.save();
      }
      return res.status(200).json({ success: true, room });
    }

    if (action === 'GET_ROOM') {
      const { roomId } = payload;
      const room = await Room.findOne({ roomId });
      if (!room) return res.status(404).json({ error: 'Room not found' });
      return res.status(200).json(room);
    }

    if (action === 'SYNC_ROOM') {
      const { roomId, updates } = payload;
      const room = await Room.findOneAndUpdate({ roomId }, { $set: updates }, { new: true });
      return res.status(200).json({ success: true });
    }

    if (action === 'CLEAR_CANVAS') {
      const { roomId } = payload;
      await Room.findOneAndUpdate({ roomId }, {
        $set: {
          stickers: [],
          todoItems: ['Plan a cute date'],
          noteState: { x: 0, y: 0, rotation: -2, scale: 1 },
          redBubble: '',
          greenBubble: '',
          photo: 'us.png',
        }
      });
      return res.status(200).json({ success: true });
    }
    
    return res.status(400).json({ error: 'Invalid action' });

  } catch (error) {
    console.error("Server Logic Error:", error);
    // Return specific error message for debugging on frontend
    return res.status(500).json({ 
      error: error.message || "Internal Server Error",
      details: "Check Vercel Logs for more info."
    });
  }
};