import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// ========== EQUIPMENT ROUTES ==========
// GET all equipment
router.get('/equipment', async (req, res) => {
  try {
    const equipment = await query('SELECT * FROM equipment WHERE is_active = 1');
    res.json(equipment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET equipment by id
router.get('/equipment/:equipment_id', async (req, res) => {
  const { equipment_id } = req.params;
  try {
    const eq = await query('SELECT * FROM equipment WHERE equipment_id = ?', [equipment_id]);
    if (!eq.length) return res.status(404).json({ error: 'Equipment not found' });
    res.json(eq[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ========== EQUIPMENT BOOKING ROUTES ==========

// GET all equipment bookings (admin)
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await query(`
      SELECT 
        b.*,
        u.first_name,
        u.last_name,
        u.email,
        GROUP_CONCAT(e.equipment_name SEPARATOR ', ') as equipment_names,
        GROUP_CONCAT(be.equipment_id SEPARATOR ',') as equipment_ids
      FROM bookings b
      JOIN users u ON b.uncw_id = u.uncw_id
      LEFT JOIN booking_equipment be ON b.booking_id = be.booking_id
      LEFT JOIN equipment e ON be.equipment_id = e.equipment_id
      WHERE b.booking_type = 'equipment'
      GROUP BY b.booking_id
      ORDER BY b.created_at DESC
    `);
    res.json(bookings);
  } catch (err) {
    console.error('Error fetching equipment bookings:', err);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

// GET equipment bookings by user
router.get('/bookings/user/:uncw_id', async (req, res) => {
  const { uncw_id } = req.params;
  try {
    const bookings = await query(`
      SELECT 
        b.*,
        GROUP_CONCAT(e.equipment_name SEPARATOR ', ') as equipment_names,
        GROUP_CONCAT(be.equipment_id SEPARATOR ',') as equipment_ids
      FROM bookings b
      LEFT JOIN booking_equipment be ON b.booking_id = be.booking_id
      LEFT JOIN equipment e ON be.equipment_id = e.equipment_id
      WHERE b.uncw_id = ? AND b.booking_type = 'equipment'
      GROUP BY b.booking_id
      ORDER BY b.created_at DESC
    `, [uncw_id]);
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST new equipment booking
router.post('/bookings', async (req, res) => {
  const { 
    uncw_id, 
    first_name, 
    last_name, 
    email, 
    phone, 
    equipment_ids, 
    equipment_names,
    departments,
    return_date, 
    purpose,
    notes 
  } = req.body;
  
  console.log('Received booking request:', { uncw_id, first_name, last_name, email, equipment_ids });
  
  try {
    // First, check if user exists
    const existingUser = await query('SELECT * FROM users WHERE uncw_id = ?', [uncw_id]);
    
    if (!existingUser.length) {
      // Get the columns of users table to know what to insert
      const userColumns = await query('SHOW COLUMNS FROM users');
      const columnNames = userColumns.map(col => col.Field);
      
      // Build insert dynamically based on available columns
      const insertFields = ['uncw_id', 'first_name', 'last_name', 'email', 'role', 'is_active'];
      const insertValues = [uncw_id, first_name || '', last_name || '', email, 'student', 1];
      
      // Add phone if column exists
      if (columnNames.includes('phone')) {
        insertFields.push('phone');
        insertValues.push(phone || '');
      }
      
      const placeholders = insertValues.map(() => '?').join(',');
      const insertQuery = `INSERT INTO users (${insertFields.join(', ')}) VALUES (${placeholders})`;
      
      await query(insertQuery, insertValues);
    }
    
    // Create booking in bookings table
    const bookingResult = await query(
      `INSERT INTO bookings 
      (uncw_id, booking_type, start_time, end_time, created_at, notes, status) 
      VALUES (?, 'equipment', NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), NOW(), ?, 'active')`,
      [uncw_id, notes || `Equipment booking: ${purpose || ''}`]
    );
    
    const bookingId = bookingResult.insertId;
    
    // Insert equipment into booking_equipment junction table
    const equipmentIdArray = Array.isArray(equipment_ids) ? equipment_ids : [equipment_ids];
    for (const equipmentId of equipmentIdArray) {
      if (equipmentId) {
        await query(
          `INSERT INTO booking_equipment (booking_id, equipment_id, quantity_requested) 
           VALUES (?, ?, 1)`,
          [bookingId, equipmentId]
        );
      }
    }
    
    // Get the complete booking with equipment info
    const newBooking = await query(`
      SELECT 
        b.*,
        u.first_name,
        u.last_name,
        u.email,
        GROUP_CONCAT(e.equipment_name SEPARATOR ', ') as equipment_names
      FROM bookings b
      JOIN users u ON b.uncw_id = u.uncw_id
      LEFT JOIN booking_equipment be ON b.booking_id = be.booking_id
      LEFT JOIN equipment e ON be.equipment_id = e.equipment_id
      WHERE b.booking_id = ?
      GROUP BY b.booking_id
    `, [bookingId]);
    
    res.status(201).json(newBooking[0]);
  } catch (err) {
    console.error('Error creating equipment booking:', err);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

// Cancel equipment booking (admin)
router.patch('/bookings/:booking_id/cancel', async (req, res) => {
  const { booking_id } = req.params;
  const { admin_uncw_id } = req.body;
  
  try {
    // Verify admin exists
    const admin = await query('SELECT * FROM users WHERE uncw_id = ? AND role = "admin"', [admin_uncw_id]);
    if (!admin.length) {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }
    
    await query(
      'UPDATE bookings SET status = "cancelled" WHERE booking_id = ?',
      [booking_id]
    );
    res.json({ message: 'Booking cancelled successfully' });
  } catch (err) {
    console.error('Error cancelling booking:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// PATCH update booking status (admin)
router.patch('/bookings/:booking_id/status', async (req, res) => {
  const { booking_id } = req.params;
  const { admin_uncw_id, status } = req.body;
  
  // Validate status
  const validStatuses = ['active', 'pending', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }
  
  try {
    // Verify admin exists
    const admin = await query('SELECT * FROM users WHERE uncw_id = ? AND role = "admin"', [admin_uncw_id]);
    if (!admin.length) {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }
    
    await query(
      'UPDATE bookings SET status = ? WHERE booking_id = ?',
      [status, booking_id]
    );
    res.json({ message: `Booking status updated to ${status}` });
  } catch (err) {
    console.error('Error updating booking status:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE equipment booking (admin)
router.delete('/bookings/:booking_id', async (req, res) => {
  const { booking_id } = req.params;
  const { admin_uncw_id } = req.body;
  
  try {
    // Verify admin exists
    const admin = await query('SELECT * FROM users WHERE uncw_id = ? AND role = "admin"', [admin_uncw_id]);
    if (!admin.length) {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }
    
    // Delete from junction table first
    await query('DELETE FROM booking_equipment WHERE booking_id = ?', [booking_id]);
    // Then delete from bookings
    await query('DELETE FROM bookings WHERE booking_id = ?', [booking_id]);
    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    console.error('Error deleting booking:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;