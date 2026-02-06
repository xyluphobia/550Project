import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  console.log('GET /api/users called');
  try {
    const users = await query('SELECT * FROM users');
    console.log('Users fetched:', users);
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create a new user
router.post('/', async (req, res) => {
  const { uncw_id, first_name, last_name, email, role, is_active } = req.body;
  if (!uncw_id || !email) {
    return res.status(400).json({ error: 'uncw_id and email are required' });
  }

  try {
    // Insert new user
    await query(
      'INSERT INTO users (uncw_id, first_name, last_name, email, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [uncw_id, first_name || '', last_name || '', email, role || 'student', is_active ?? 1]
    );

    // Retrieve the new user
    const newUser = await query('SELECT * FROM users WHERE uncw_id = ?', [uncw_id]);
    res.status(201).json(newUser[0]);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;

