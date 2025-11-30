
// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // Limit increased for images

// 1. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Mongo Error:', err));

// 2. Define the Schema (Data Structure)
const AppDataSchema = new mongoose.Schema({
  id: { type: String, default: 'main_room' }, // We only use one room for now
  stickers: Array,
  todoItems: Array,
  noteState: Object,
  redBubble: String,
  greenBubble: String,
  photo: String // Base64 image
});

const AppData = mongoose.model('AppData', AppDataSchema);

// 3. API Routes

// GET: Fetch all data
app.get('/api/data', async (req, res) => {
  let data = await AppData.findOne({ id: 'main_room' });
  if (!data) {
    // Create default if doesn't exist
    data = await AppData.create({ id: 'main_room', stickers: [], todoItems: [] });
  }
  res.json(data);
});

// POST: Update data
app.post('/api/data', async (req, res) => {
  const { stickers, todoItems, noteState, redBubble, greenBubble, photo } = req.body;
  
  // Update the entry
  await AppData.findOneAndUpdate(
    { id: 'main_room' },
    { stickers, todoItems, noteState, redBubble, greenBubble, photo },
    { upsert: true, new: true }
  );
  
  res.json({ success: true });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
