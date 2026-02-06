import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// GET all rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await query('SELECT * FROM rooms');
    res.json(rooms);
    console.log('Rooms fetched:', rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET single room by id
router.get('/:room_id', async (req, res) => {
  const { id } = req.params;
  try {
    const room = await query('SELECT * FROM rooms WHERE room_id = ?', [id]);
    if (!room.length) return res.status(404).json({ error: 'Room not found' });
    console.log('Room fetched:', room);
    res.json(room[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST new room
router.post('/', async (req, res) => {
  const { room_id, building_name, room_capacity, has_whiteboard, has_monitor, is_active } = req.body;
  try {
    const result = await query(
      'INSERT INTO rooms (room_id, building_name, room_capacity, has_whiteboard, has_monitor, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [room_id, building_name, room_capacity, has_whiteboard, has_monitor, is_active]
    );    
    const newRoom = await query('SELECT * FROM rooms WHERE room_id = ?', [result.insertId]);
    console.log('Room added:', newRoom);
    res.status(201).json(newRoom[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// PUT update room
router.put('/:room_id', async (req, res) => {
  const { id } = req.params;
  const { building_name, room_capacity, has_whiteboard, has_monitor, is_active } = req.body;
  try {
    await query('UPDATE rooms SET building_name = ?, room_capacity = ?, has_whiteboard = ?, has_monitor = ?, is_active = ? WHERE room_id = ?', [building_name, room_capacity, has_whiteboard, has_monitor, is_active, id]);
    const updatedRoom = await query('SELECT * FROM rooms WHERE room_id = ?', [id]);
    console.log('Updated Room:', updatedRoom);
    res.json(updatedRoom[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE room
router.delete('/:room_id', async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM rooms WHERE room_id = ?', [id]);
    res.json({ message: 'Room deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;

