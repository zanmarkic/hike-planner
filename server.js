const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json()); // omogoča branje JSON body

let hikes = [
  { id: 1, name: "Triglav", location: "Julijske Alpe", difficulty: "Težko" },
  { id: 2, name: "Šmarna gora", location: "Ljubljana", difficulty: "Lahko" },
  { id: 3, name: "Pohorje", location: "Maribor", difficulty: "Srednje" }
];

// GET - pridobi vse poti
app.get('/api/hikes', (req, res) => {
  res.json(hikes);
});

// POST - dodaj novo pot
app.post('/api/hikes', (req, res) => {
  const { name, location, difficulty } = req.body;

  if (!name || !location || !difficulty) {
    return res.status(400).json({ error: "Vsa polja so obvezna" });
  }

  const newHike = {
    id: hikes.length + 1,
    name,
    location,
    difficulty
  };

  hikes.push(newHike);
  res.status(201).json(newHike);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});