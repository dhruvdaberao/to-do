// api/data.js
const mongoose = require('mongoose');

// Cached connection for Vercel hot reloads
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) return;
  
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  await mongoose.connect(process.env.MONGO_URI);
  isConnected = true;
};

// Define Schema
const AppDataSchema = new mongoose.Schema({
  id: { type: String, default: 'main_room' },
  stickers: Array,
  todoItems: Array,
  noteState: Object,
  redBubble: String,
  greenBubble: String,
  photo: String
});

// Prevent model recompilation error in serverless
let AppData;
try {
  AppData = mongoose.model('AppData');
} catch {
  AppData = mongoose.model('AppData', AppDataSchema);
}

module.exports = async (req, res) => {
  // 1. Handle CORS (So your frontend can talk to it)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await connectToDatabase();

    // GET: Fetch Data
    if (req.method === 'GET') {
      let data = await AppData.findOne({ id: 'main_room' });
      if (!data) {
        data = await AppData.create({ id: 'main_room', stickers: [], todoItems: [] });
      }
      return res.status(200).json(data);
    }

    // POST: Save Data
    if (req.method === 'POST') {
      const { stickers, todoItems, noteState, redBubble, greenBubble, photo } = req.body;
      
      await AppData.findOneAndUpdate(
        { id: 'main_room' },
        { stickers, todoItems, noteState, redBubble, greenBubble, photo },
        { upsert: true, new: true }
      );
      
      return res.status(200).json({ success: true });
    }

    // Invalid Method
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};