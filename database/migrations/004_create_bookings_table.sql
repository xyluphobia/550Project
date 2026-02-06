CREATE TABLE bookings (
  booking_id INT AUTO_INCREMENT PRIMARY KEY,
  uncw_id INT NOT NULL,
  booking_type VARCHAR(64) NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  created_at DATETIME,
  notes VARCHAR(500),
  group_size tinyint,
  is_joinable bit,

  CONSTRAINT fk_bookings_user
    FOREIGN KEY (uncw_id)
    REFERENCES users(uncw_id)
) ENGINE=InnoDB;
