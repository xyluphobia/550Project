CREATE TABLE users (
  uncw_id INT PRIMARY KEY,
  first_name VARCHAR(64),
  last_name VARCHAR(64),
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(64),
  is_active BIT
);

