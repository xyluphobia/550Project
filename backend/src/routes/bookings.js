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
router.get('/:booking_id', async (req, res) => {
<<<<<<< HEAD
  const { booking_id } = req.params;
  try {
    const booking = await query('SELECT * FROM bookings WHERE id = ?', [booking_id]);
=======
  const { id } = req.params;
  try {
    const booking = await query('SELECT * FROM bookings WHERE id = ?', [id]);
>>>>>>> frontend
    if (!booking.length) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST new booking
router.post('/', async (req, res) => {
<<<<<<< HEAD
  const { uncw_id, booking_type, start_time, end_time, created_at, notes = null, group_size = null, is_joinable = null, room_id = null, equipment_id = null, quantity_requested = null } = req.body;

  // Basic Validation
  if (!uncw_id || !booking_type || !start_time || !end_time) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const start = new Date(start_time);
  const end = new Date(end_time);

  if (isNaN(start) || isNaN(end)) {
    return res.status(400).json({ error: 'Invalid date format.' });
  }

  if (start >= end) {
    return res.status(400).json({ error: 'Start time must be before end time.' });
  }

  if (!room_id && !equipment_id) {
    return res.status(400).json({ error: 'Must specify a room or equipment.' });
  }

  if (equipment_id && (!quantity_requested || quantity_requested <= 0)) {
    return res.status(400).json({ error: 'Invalid equipment quantity requested.' });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Add rooms
    if (room_id) {
      const [conflict] = await connection.query(`
        SELECT 1
        FROM bookings b
        JOIN booking_rooms br ON b.booking_id = br.booking_id
        WHERE br.room_id = ?
        AND b.start_time < ?
        AND b.end_time > ?
        LIMIT 1
      `, [room_id, end_time, start_time]);

      if (conflict.length > 0) {
        await connection.rollback();
        return res.status(400).json({
          error: 'Room already booked during that time.'
        });
      }
    }

    // Add equipment
    else if (equipment_id) {
      // Lock equipment row
      const [[equipment]] = await connection.query(`
        SELECT total_quantity
        FROM equipment
        WHERE equipment_id = ?
        AND is_active = 1
        FOR UPDATE
      `, [equipment_id]);

      if (!equipment) {
        await connection.rollback();
        return res.status(400).json({ error: 'Equipment not found or inactive.' });
      }

      const totalQuantity = equipment.total_quantity;

      // Sum overlapping bookings
      const [[overlap]] = await connection.query(`
        SELECT COALESCE(SUM(be.quantity_requested), 0) AS booked_quantity
        FROM bookings b
        JOIN booking_equipment be ON b.booking_id = be.booking_id
        WHERE be.equipment_id = ?
        AND b.start_time < ?
        AND b.end_time > ?
      `, [equipment_id, end_time, start_time]);

      const alreadyBooked = overlap.booked_quantity;

      if (alreadyBooked + quantity_requested > totalQuantity) {
        await connection.rollback();
        return res.status(400).json({
          error: 'Not enough equipment available for that time slot.'
        });
      }
    }

    const [result] = await connection.query(`
      INSERT INTO bookings
      (uncw_id, booking_type, start_time, end_time, created_at, notes, group_size, is_joinable)
      VALUES (?, ?, ?, ?, NOW(), ?, ?, ?)
    `, [
      uncw_id,
      booking_type,
      start_time,
      end_time,
      notes,
      group_size,
      is_joinable
    ]);

    const booking_id = result.insertId;

    if (room_id) {
      await connection.query(`
        INSERT INTO booking_rooms (booking_id, room_id)
        VALUES (?, ?)
      `, [booking_id, room_id]);
    }

    if (equipment_id) {
      await connection.query(`
        INSERT INTO booking_equipment (booking_id, equipment_id, quantity_requested)
        VALUES (?, ?, ?)
      `, [booking_id, equipment_id, quantity_requested]);
    }

    await connection.commit();

    res.status(201).json({
      message: 'Booking created successfully.',
      booking_id
    });

  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: 'Database error.' });
  } finally {
    connection.release();
=======
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
>>>>>>> frontend
  }
});

// DELETE booking
router.delete('/:booking_id', async (req, res) => {
<<<<<<< HEAD
  const { booking_id } = req.params;
  try {
    // Delete booking-related rooms and equipment first
    await query('DELETE FROM booking_rooms WHERE booking_id = ?', [booking_id]);
    await query('DELETE FROM booking_equipment WHERE booking_id = ?', [booking_id]);
    await query('DELETE FROM bookings WHERE id = ?', [booking_id]);
=======
  const { id } = req.params;
  try {
    // Delete booking-related rooms and equipment first
    await query('DELETE FROM bookings_rooms WHERE booking_id = ?', [id]);
    await query('DELETE FROM bookings_equipment WHERE booking_id = ?', [id]);
    await query('DELETE FROM bookings WHERE id = ?', [id]);
>>>>>>> frontend

    res.json({ message: 'Booking deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;

