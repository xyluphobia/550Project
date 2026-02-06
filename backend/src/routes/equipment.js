import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// GET all equipment
router.get('/', async (req, res) => {
  try {
    const equipment = await query('SELECT * FROM equipment');
    res.json(equipment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET equipment by id
router.get('/:equipment_id', async (req, res) => {
  const { id } = req.params;
  try {
    const eq = await query('SELECT * FROM equipment WHERE id = ?', [id]);
    if (!eq.length) return res.status(404).json({ error: 'Equipment not found' });
    res.json(eq[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST new equipment
router.post('/', async (req, res) => {
  const { name, quantity } = req.body;
  try {
    const result = await query(
      'INSERT INTO equipment (name, quantity) VALUES (?, ?)',
      [name, quantity]
    );
    const newEq = await query('SELECT * FROM equipment WHERE id = ?', [result.insertId]);
    res.status(201).json(newEq[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// PUT update equipment
router.put('/:equipment_id', async (req, res) => {
  const { id } = req.params;
  const { name, quantity } = req.body;
  try {
    await query('UPDATE equipment SET name = ?, quantity = ? WHERE id = ?', [name, quantity, id]);
    const updatedEq = await query('SELECT * FROM equipment WHERE id = ?', [id]);
    res.json(updatedEq[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE equipment
router.delete('/:equipment_id', async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM equipment WHERE id = ?', [id]);
    res.json({ message: 'Equipment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;

