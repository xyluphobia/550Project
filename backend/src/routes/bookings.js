import express from 'express';
import { query, pool } from '../db.js';

const router = express.Router();

// GET all bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await query(`
      SELECT DISTINCT b.booking_id, b.uncw_id, b.booking_type, b.start_time, b.end_time,
             b.created_at, b.notes, b.status,
             br.room_id,
             u.first_name, u.last_name, u.email
      FROM bookings b
      LEFT JOIN booking_rooms br ON b.booking_id = br.booking_id
      LEFT JOIN users u ON b.uncw_id = u.uncw_id
      ORDER BY b.start_time DESC
    `);
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET booking by id
router.get('/:booking_id', async (req, res) => {
  const { booking_id } = req.params;
  try {
    const booking = await query('SELECT * FROM bookings WHERE id = ?', [booking_id]);
    if (!booking.length) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST new booking
router.post('/', async (req, res) => {
  const { uncw_id, booking_type, start_time, end_time, created_at, notes = null, group_size = null, is_joinable = null, room_id = null, equipment_id = null, quantity_requested = null } = req.body;

  // Basic Validation
  if (!uncw_id || !booking_type || !start_time || !end_time) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  // Append 'Z' so the MySQL-format UTC string is parsed as UTC, not local time
  const start = new Date(start_time.replace(' ', 'T') + 'Z');
  const end = new Date(end_time.replace(' ', 'T') + 'Z');

  if (isNaN(start) || isNaN(end)) {
    return res.status(400).json({ error: 'Invalid date format.' });
  }

  if (start >= end) {
    return res.status(400).json({ error: 'Start time must be before end time.' });
  }

  if (end <= new Date()) {
    return res.status(400).json({ error: 'Cannot book a time slot that has already ended.' });
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
    try {
      if (room_id) {
        const [conflict] = await connection.query(`
          SELECT 1
          FROM bookings b
          JOIN booking_rooms br ON b.booking_id = br.booking_id
          WHERE br.room_id = ?
          AND b.start_time < ?
          AND b.end_time > ?
          AND b.status = 'active'
          LIMIT 1
        `, [room_id, end_time, start_time]);

        if (conflict.length > 0) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({
            error: 'Room already booked during that time.'
          });
        }

        // Check room blocks
        const [blocked] = await connection.query(`
          SELECT 1 FROM room_blocks
          WHERE room_id = ?
          AND start_time < ?
          AND end_time > ?
          LIMIT 1
        `, [room_id, end_time, start_time]);

        if (blocked.length > 0) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({
            error: 'Room is blocked by an administrator during that time.'
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
          connection.release();
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
          AND b.status = 'active'
        `, [equipment_id, end_time, start_time]);

        const alreadyBooked = overlap.booked_quantity;

        if (alreadyBooked + quantity_requested > totalQuantity) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({
            error: 'Not enough equipment available for that time slot.'
          });
        }
      }
    } catch (validationErr) {
      await connection.rollback();
      connection.release();
      console.error(validationErr);
      return res.status(500).json({ error: 'Database error.' });
    }

    const [result] = await connection.query(`
      INSERT INTO bookings
      (uncw_id, booking_type, start_time, end_time, created_at, notes)
      VALUES (?, ?, ?, ?, NOW(), ?)
    `, [
      uncw_id,
      booking_type,
      start.toISOString().slice(0, 19).replace('T', ' '),
      end.toISOString().slice(0, 19).replace('T', ' '),
      notes
    ]);

    const booking_id = result.insertId;

    if (room_id) {
      await connection.query(`
        INSERT INTO booking_rooms (booking_id, room_id, group_size, is_joinable)
        VALUES (?, ?, ?, ?)
      `, [booking_id, room_id, group_size, is_joinable]);
    }

    if (equipment_id) {
      await connection.query(`
        INSERT INTO booking_equipment (booking_id, equipment_id, quantity_requested)
        VALUES (?, ?, ?)
      `, [booking_id, equipment_id, quantity_requested]);
    }

    await connection.commit();
    connection.release();

    res.status(201).json({
      message: 'Booking created successfully.',
      booking_id
    });

  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error(err);
    res.status(500).json({ error: 'Database error.' });
  }
});

// PATCH cancel booking (admin only)
router.patch('/:booking_id/cancel', async (req, res) => {
  const { booking_id } = req.params;
  const { admin_uncw_id } = req.body;

  if (!admin_uncw_id) {
    return res.status(400).json({ error: 'admin_uncw_id is required.' });
  }

  try {
    // Verify the requesting user is an admin
    const adminUser = await query(
      'SELECT role FROM users WHERE uncw_id = ?',
      [admin_uncw_id]
    );

    if (!adminUser.length || adminUser[0].role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    // Check booking exists, is not already cancelled, and has not ended
    const booking = await query(
      'SELECT booking_id, status, end_time FROM bookings WHERE booking_id = ?',
      [booking_id]
    );

    if (!booking.length) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    if (booking[0].status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled.' });
    }

    if (new Date(booking[0].end_time) < new Date()) {
      return res.status(400).json({ error: 'Cannot cancel a booking that has already ended.' });
    }

    await query(
      "UPDATE bookings SET status = 'cancelled' WHERE booking_id = ?",
      [booking_id]
    );

    res.json({ message: 'Booking cancelled successfully.', booking_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error.' });
  }
});

// DELETE booking
router.delete('/:booking_id', async (req, res) => {
  const { booking_id } = req.params;
  try {
    // Delete booking-related rooms and equipment first
    await query('DELETE FROM booking_rooms WHERE booking_id = ?', [booking_id]);
    await query('DELETE FROM booking_equipment WHERE booking_id = ?', [booking_id]);
    await query('DELETE FROM bookings WHERE booking_id = ?', [booking_id]);

    res.json({ message: 'Booking deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;

