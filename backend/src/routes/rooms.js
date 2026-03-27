import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// GET all rooms (with optional filters via query params)
// Supported filters: building_name, min_capacity, has_whiteboard, has_monitor, is_active, available_start, available_end
router.get('/', async (req, res) => {
  try {
    const { building_name, min_capacity, has_whiteboard, has_monitor, is_active, available_start, available_end } = req.query;

    let sql = 'SELECT * FROM rooms WHERE 1=1';
    const params = [];

    if (building_name) {
      sql += ' AND building_name = ?';
      params.push(building_name);
    }
    if (min_capacity) {
      sql += ' AND room_capacity >= ?';
      params.push(parseInt(min_capacity, 10));
    }
    if (has_whiteboard !== undefined) {
      sql += ' AND has_whiteboard = ?';
      params.push(parseInt(has_whiteboard, 10));
    }
    if (has_monitor !== undefined) {
      sql += ' AND has_monitor = ?';
      params.push(parseInt(has_monitor, 10));
    }
    if (is_active !== undefined) {
      sql += ' AND is_active = ?';
      params.push(parseInt(is_active, 10));
    }
    if (available_start && available_end) {
      sql += ` AND room_id NOT IN (
        SELECT br.room_id FROM booking_rooms br
        JOIN bookings b ON br.booking_id = b.booking_id
        WHERE b.start_time < ? AND b.end_time > ?
      )`;
      params.push(available_end, available_start);
    }

    const rooms = await query(sql, params);
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

