ALTER TABLE bookings
  ADD COLUMN status ENUM('active', 'cancelled') NOT NULL DEFAULT 'active'
  AFTER notes;
