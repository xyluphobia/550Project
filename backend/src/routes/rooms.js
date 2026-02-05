import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// GET all rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await query('SELECT * FROM rooms');
    res.json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET single room by id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const room = await query('SELECT * FROM rooms WHERE id = ?', [id]);
    if (!room.length) return res.status(404).json({ error: 'Room not found' });
    res.json(room[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST new room
router.post('/', async (req, res) => {
  const { name, capacity } = req.body;
  try {
    const result = await query(
      'INSERT INTO rooms (name, capacity) VALUES (?, ?)',
      [name, capacity]
    );
    const newRoom = await query('SELECT * FROM rooms WHERE id = ?', [result.insertId]);
    res.status(201).json(newRoom[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// PUT update room
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, capacity } = req.body;
  try {
    await query('UPDATE rooms SET name = ?, capacity = ? WHERE id = ?', [name, capacity, id]);
    const updatedRoom = await query('SELECT * FROM rooms WHERE id = ?', [id]);
    res.json(updatedRoom[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE room
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM rooms WHERE id = ?', [id]);
    res.json({ message: 'Room deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;

