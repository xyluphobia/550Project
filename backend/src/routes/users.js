import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await query('SELECT * FROM users');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create a new user
router.post('/', async (req, res) => {
  const { uncw_id } = req.body;
  try {
    const result = await query(
      'INSERT INTO users (uncw_id) VALUES (?)',
      [uncw_id]
    );
    // result.insertId is the new row ID
    const newUser = await query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    res.status(201).json(newUser[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;

