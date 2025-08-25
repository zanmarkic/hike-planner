const express = require('express');
const { Pool } = require('pg');  // <-- Dodamo postgres
const app = express();
const PORT = 3000;

// Middleware, da lahko beremo JSON v requestih
app.use(express.json());

// Povezava na Postgres bazo
const pool = new Pool({
  user: 'postgres',      // <-- uporabniško ime
  host: 'localhost',     // <-- če je lokalno
  database: 'hike_planner', // <-- ime baze iz točke 2
  password: 'Pesmaxi1000',   // <-- tukaj daj geslo, ki si ga nastavil
  port: 1231,            // privzeti port
});

// Testna ruta za preverjanje povezave na bazo
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.send(`Povezava dela ✅ Čas na bazi je: ${result.rows[0].now}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Napaka pri povezavi z bazo ❌');
  }
});

// Osnovna ruta
app.get('/', (req, res) => {
  res.send('Hello World! 🚀');
});

// Zaženi strežnik
app.listen(PORT, () => {
  console.log(`Server teče na http://localhost:${PORT}`);
});