
import mongoose from 'mongoose';

// --- 1. CONFIGURATION & CACHING ---
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectToDatabase = async () => {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is missing in Vercel Environment Variables.');
  if (uri.includes('<password>')) throw new Error('Your MONGO_URI still contains "<password>".');

  if (!cached.promise) {
    const opts = { bufferCommands: false, serverSelectionTimeoutMS: 5000 };
    console.log("Connecting to MongoDB...");
    cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
      console.log("MongoDB Connected Successfully");
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("MongoDB Connection Failed:", e);
    throw e;
  }
  return cached.conn;
};

// --- 2. SCHEMAS ---
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const RoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  pin: { type: String, required: true },
  eventName: { type: String, default: 'Us' }, // NEW: Dynamic Event Name
  targetISO: { type: String }, 
  targetDate: { type: Object }, // Legacy
  creatorId: String,
  members: [String],
  stickers: { type: Array, default: [] },
  todoItems: { type: Array, default: [] },
  noteState: { type: Object, default: { x: 0, y: 0, rotation: -2, scale: 1 } },
  photo: { type: String, default: 'us.png' },
  customLibrary: { type: Array, default: [] },
  chatMessages: { type: Array, default: [] }
});

let User, Room;
try {
  User = mongoose.model('User');
  Room = mongoose.model('Room');
} catch {
  User = mongoose.model('User', UserSchema);
  Room = mongoose.model('Room', RoomSchema);
}

// --- 3. SERVERLESS HANDLER ---
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.status(200).json({ status: 'API is running' });

  try {
    await connectToDatabase();
    const { action, payload } = req.body;
    if (!action) return res.status(400).json({ error: 'No action provided' });

    if (action === 'REGISTER') {
      const { username, password } = payload;
      const existing = await User.findOne({ username });
      if (existing) return res.status(400).json({ error: 'Username already taken' });
      const newUser = await User.create({ username, password });
      return res.status(200).json({ success: true, userId: newUser._id, username });
    }

    if (action === 'LOGIN') {
      const { username, password } = payload;
      const user = await User.findOne({ username, password });
      if (!user) return res.status(401).json({ error: 'Invalid username or password' });
      return res.status(200).json({ success: true, userId: user._id, username });
    }

    if (action === 'CREATE_ROOM') {
      const { roomId, pin, targetISO, creatorId } = payload;
      const existing = await Room.findOne({ roomId });
      if (existing) return res.status(400).json({ error: 'Room Name already exists' });
      
      const newRoom = await Room.create({ 
          roomId, 
          pin, 
          targetISO,
          eventName: 'Us', // Default
          targetDate: {}, 
          creatorId, 
          members: [creatorId] 
      });
      return res.status(200).json({ success: true, room: newRoom });
    }

    if (action === 'JOIN_ROOM') {
      const { roomId, pin, username } = payload;
      const room = await Room.findOne({ roomId });
      if (!room) return res.status(404).json({ error: 'Room not found' });
      if (room.pin !== pin) return res.status(403).json({ error: 'Incorrect PIN' });
      
      if (!room.members.includes(username)) {
        room.members.push(username);
        await room.save();
      }
      return res.status(200).json({ success: true, room });
    }

    if (action === 'GET_USER_ROOMS') {
        const { username } = payload;
        const rooms = await Room.find({ members: username });
        return res.status(200).json({ success: true, rooms });
    }

    if (action === 'GET_ROOM') {
      const { roomId } = payload;
      const room = await Room.findOne({ roomId });
      if (!room) return res.status(404).json({ error: 'Room not found' });
      return res.status(200).json(room);
    }

    if (action === 'SYNC_ROOM') {
      const { roomId, updates } = payload;
      await Room.findOneAndUpdate({ roomId }, { $set: updates });
      return res.status(200).json({ success: true });
    }

    // NEW: Update Room Details (Date, Time, Name)
    if (action === 'UPDATE_ROOM_DETAILS') {
        const { roomId, eventName, targetISO } = payload;
        await Room.findOneAndUpdate({ roomId }, { 
            $set: { eventName, targetISO } 
        });
        return res.status(200).json({ success: true });
    }

    if (action === 'CLEAR_CANVAS') {
      const { roomId } = payload;
      await Room.findOneAndUpdate({ roomId }, {
        $set: {
          stickers: [],
          todoItems: [],
          noteState: { x: 0, y: 0, rotation: -2, scale: 1 },
          photo: 'us.png',
        }
      });
      return res.status(200).json({ success: true });
    }
    
    return res.status(400).json({ error: 'Unknown action' });

  } catch (error) {
    console.error("API Logic Error:", error);
    if (error.code === 11000) {
        return res.status(400).json({ error: "Username or Room ID already taken (Duplicate Key)", details: error.message });
    }
    return res.status(500).json({ error: "Backend Error", details: error.message });
  }
}
