import express from 'express';
import { query, pool } from '../db.js';

const router = express.Router();

// GET all room blocks
router.get('/', async (req, res) => {
  try {
    const blocks = await query(`
      SELECT rb.*, r.room_code, r.building_name,
             u.first_name, u.last_name
      FROM room_blocks rb
      JOIN rooms r ON rb.room_id = r.room_id
      LEFT JOIN users u ON rb.admin_uncw_id = u.uncw_id
      ORDER BY rb.start_time DESC
    `);
    res.json(blocks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST create a room block (admin only)
router.post('/', async (req, res) => {
  const { admin_uncw_id, room_id, start_time, end_time, reason = null } = req.body;

  if (!admin_uncw_id || !room_id || !start_time || !end_time) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  // Append 'Z' so the MySQL-format UTC string is parsed as UTC, not local time
  const start = new Date(start_time.replace(' ', 'T') + 'Z');
  const end = new Date(end_time.replace(' ', 'T') + 'Z');

  if (isNaN(start) || isNaN(end) || start >= end) {
    return res.status(400).json({ error: 'Invalid time range.' });
  }

  try {
    // Verify admin role
    const adminUser = await query(
      'SELECT role FROM users WHERE uncw_id = ?',
      [admin_uncw_id]
    );
    if (!adminUser.length || adminUser[0].role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    // Verify room exists
    const room = await query(
      'SELECT room_id FROM rooms WHERE room_id = ? AND is_active = 1',
      [room_id]
    );
    if (!room.length) {
      return res.status(404).json({ error: 'Room not found or inactive.' });
    }

    const formatForDB = (d) => d.toISOString().slice(0, 19).replace('T', ' ');

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Find all blocks for this room that overlap the requested range
      const [overlapping] = await connection.query(
        `SELECT block_id, start_time, end_time FROM room_blocks
         WHERE room_id = ? AND start_time < ? AND end_time > ?`,
        [room_id, formatForDB(end), formatForDB(start)]
      );

      // Compute merged time range (earliest start, latest end)
      let mergedStart = start;
      let mergedEnd = end;
      const mergedBlockIds = overlapping.map(b => b.block_id);

      for (const block of overlapping) {
        const bs = new Date(block.start_time);
        const be = new Date(block.end_time);
        if (bs < mergedStart) mergedStart = bs;
        if (be > mergedEnd) mergedEnd = be;
      }

      // Remove any blocks that are being absorbed into the merged block
      if (mergedBlockIds.length > 0) {
        await connection.query(
          `DELETE FROM room_blocks WHERE block_id IN (?)`,
          [mergedBlockIds]
        );
      }

      const [result] = await connection.query(
        `INSERT INTO room_blocks (room_id, admin_uncw_id, start_time, end_time, reason, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [room_id, admin_uncw_id, formatForDB(mergedStart), formatForDB(mergedEnd), reason]
      );

      await connection.commit();

      res.status(201).json({
        message: mergedBlockIds.length > 0
          ? 'Block created and merged with existing block(s).'
          : 'Room blocked successfully.',
        block_id: result.insertId,
        start_time: mergedStart.toISOString(),
        end_time: mergedEnd.toISOString(),
        merged: mergedBlockIds.length > 0,
        merged_block_ids: mergedBlockIds
      });
    } catch (innerErr) {
      await connection.rollback();
      throw innerErr;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error.' });
  }
});

// PUT update a room block's end time (admin only)
router.put('/:block_id', async (req, res) => {
  const { block_id } = req.params;
  const { admin_uncw_id, end_time } = req.body;

  if (!admin_uncw_id || !end_time) {
    return res.status(400).json({ error: 'admin_uncw_id and end_time are required.' });
  }

  try {
    const adminUser = await query(
      'SELECT role FROM users WHERE uncw_id = ?',
      [admin_uncw_id]
    );
    if (!adminUser.length || adminUser[0].role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const existing = await query(
      'SELECT block_id, start_time FROM room_blocks WHERE block_id = ?',
      [block_id]
    );
    if (!existing.length) {
      return res.status(404).json({ error: 'Block not found.' });
    }

    const start = new Date(existing[0].start_time);
    const end = new Date(end_time);
    if (isNaN(end) || end <= start) {
      return res.status(400).json({ error: 'end_time must be after start_time.' });
    }

    await query(
      'UPDATE room_blocks SET end_time = ? WHERE block_id = ?',
      [end_time, block_id]
    );
    res.json({ message: 'Block updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error.' });
  }
});

// DELETE remove a room block (admin only)
router.delete('/:block_id', async (req, res) => {
  const { block_id } = req.params;
  const { admin_uncw_id } = req.body;

  if (!admin_uncw_id) {
    return res.status(400).json({ error: 'admin_uncw_id is required.' });
  }

  try {
    const adminUser = await query(
      'SELECT role FROM users WHERE uncw_id = ?',
      [admin_uncw_id]
    );
    if (!adminUser.length || adminUser[0].role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const existing = await query(
      'SELECT block_id FROM room_blocks WHERE block_id = ?',
      [block_id]
    );
    if (!existing.length) {
      return res.status(404).json({ error: 'Block not found.' });
    }

    await query('DELETE FROM room_blocks WHERE block_id = ?', [block_id]);
    res.json({ message: 'Block removed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error.' });
  }
});

export default router;
