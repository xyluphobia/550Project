CREATE TABLE room_blocks (
  block_id INT AUTO_INCREMENT PRIMARY KEY,
  room_id INT NOT NULL,
  admin_uncw_id INT,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  reason VARCHAR(500),
  created_at DATETIME DEFAULT NOW(),

  CONSTRAINT fk_room_blocks_room
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,

  CONSTRAINT fk_room_blocks_admin
    FOREIGN KEY (admin_uncw_id) REFERENCES users(uncw_id) ON DELETE SET NULL
) ENGINE=InnoDB;
