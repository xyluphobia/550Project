CREATE TABLE booking_rooms (
  booking_room_id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  room_id INT NOT NULL,

  CONSTRAINT fk_booking_rooms_booking
    FOREIGN KEY (booking_id)
    REFERENCES bookings(booking_id)
    ON DELETE CASCADE,

  CONSTRAINT fk_booking_rooms_room
    FOREIGN KEY (room_id)
    REFERENCES rooms(room_id)
);
