-- Index for time overlap filtering
CREATE INDEX idx_bookings_time
ON bookings(start_time, end_time);

-- Index for room lookups
CREATE INDEX idx_booking_rooms_room
ON booking_rooms(room_id);

-- Index for equipment lookups
CREATE INDEX idx_booking_equipment_equipment
ON booking_equipment(equipment_id);

CREATE INDEX idx_booking_rooms_room_booking
ON booking_rooms(room_id, booking_id);

CREATE INDEX idx_booking_equipment_equipment_booking
ON booking_equipment(equipment_id, booking_id);

