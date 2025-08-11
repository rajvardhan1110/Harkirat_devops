const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// MongoDB connection
// If running Node on the host machine (not in Docker):
// const mongoURI = 'mongodb://127.0.0.1:27017/mydatabase';

// If running Node inside same Docker network as MongoDB:
const mongoURI = 'mongodb://check_mongo:27017/mydatabase';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Sample schema & model
const DataSchema = new mongoose.Schema({
  name: String,
  value: Number
});
const DataModel = mongoose.model('Data', DataSchema);

// Routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/data', async (req, res) => {
  try {
    const newData = new DataModel(req.body);
    await newData.save();
    res.json({
      message: 'Data saved successfully',
      data: newData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/data', async (req, res) => {
  try {
    const allData = await DataModel.find();
    res.json(allData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
