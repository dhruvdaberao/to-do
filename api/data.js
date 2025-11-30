const mongoose = require('mongoose');

// --- 1. CONFIGURATION ---
// We cache the connection so we don't reconnect on every request
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) {
    console.log('=> Using existing database connection');
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is missing in Vercel!');
  }

  console.log('=> Using new database connection');
  // Connect to MongoDB
  await mongoose.connect(process.env.MONGO_URI);
  isConnected = true;
};

// --- 2. DATABASE SCHEMA ---
// This defines what our data looks like in MongoDB
const AppDataSchema = new mongoose.Schema({
  id: { type: String, default: 'main_room' }, // We use one ID to sync everyone to the same room
  stickers: Array,
  todoItems: Array,
  noteState: Object,
  redBubble: String,
  greenBubble: String,
  photo: String
});

// Prevent model recompilation error in serverless environment
let AppData;
try {
  AppData = mongoose.model('AppData');
} catch {
  AppData = mongoose.model('AppData', AppDataSchema);
}

// --- 3. THE SERVERLESS HANDLER ---
// This function runs every time the frontend requests data
module.exports = async (req, res) => {
  // Setup CORS to allow your frontend to talk to this backend
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle the "Preflight" check from the browser
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Connect to DB
    await connectToDatabase();

    // GET Request: Frontend asking for latest data
    if (req.method === 'GET') {
      let data = await AppData.findOne({ id: 'main_room' });
      // If no data exists yet, create the initial empty record
      if (!data) {
        data = await AppData.create({ id: 'main_room' });
      }
      return res.status(200).json(data);
    }

    // POST Request: Frontend sending new data to save
    if (req.method === 'POST') {
      const payload = req.body;
      // Update the data in MongoDB
      await AppData.findOneAndUpdate({ id: 'main_room' }, payload, { upsert: true });
      return res.status(200).json({ success: true });
    }

  } catch (error) {
    console.error("Database Error:", error);
    return res.status(500).json({ error: error.message });
  }
};