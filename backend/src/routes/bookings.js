import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// GET all bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await query('SELECT * FROM bookings');
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET booking by id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await query('SELECT * FROM bookings WHERE id = ?', [id]);
    if (!booking.length) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST new booking
router.post('/', async (req, res) => {
  const { userId, startTime, endTime, roomIds = [], equipmentIds = [] } = req.body;

  try {
    // Create booking
    const result = await query(
      'INSERT INTO bookings (user_id, start_time, end_time) VALUES (?, ?, ?)',
      [userId, startTime, endTime]
    );
    const bookingId = result.insertId;

    // Add rooms
    for (const roomId of roomIds) {
      await query('INSERT INTO bookings_rooms (booking_id, room_id) VALUES (?, ?)', [bookingId, roomId]);
    }

    // Add equipment
    for (const eqId of equipmentIds) {
      await query('INSERT INTO bookings_equipment (booking_id, equipment_id) VALUES (?, ?)', [bookingId, eqId]);
    }

    const newBooking = await query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    res.status(201).json(newBooking[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE booking
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Delete booking-related rooms and equipment first
    await query('DELETE FROM bookings_rooms WHERE booking_id = ?', [id]);
    await query('DELETE FROM bookings_equipment WHERE booking_id = ?', [id]);
    await query('DELETE FROM bookings WHERE id = ?', [id]);

    res.json({ message: 'Booking deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;

