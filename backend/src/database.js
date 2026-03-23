import mysql from 'mysql2/promise';

console.log('DB config:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  hasPassword: !!process.env.DB_PASSWORD,
});

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'planning',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
});

try {
  await pool.execute(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'visitor') NOT NULL DEFAULT 'visitor',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.execute(`CREATE TABLE IF NOT EXISTS locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.execute(`CREATE TABLE IF NOT EXISTS worksite_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(20) NOT NULL DEFAULT '#2563eb',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.execute(`CREATE TABLE IF NOT EXISTS plannings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    week_start VARCHAR(10),
    start_date VARCHAR(10),
    end_date VARCHAR(10),
    location_id INT NOT NULL,
    worksite_type_id INT NOT NULL,
    notes TEXT,
    day_type VARCHAR(20) NOT NULL DEFAULT 'full',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    FOREIGN KEY (worksite_type_id) REFERENCES worksite_types(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.execute(`CREATE TABLE IF NOT EXISTS planning_users (
    planning_id INT NOT NULL,
    user_id INT NOT NULL,
    PRIMARY KEY (planning_id, user_id),
    FOREIGN KEY (planning_id) REFERENCES plannings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  console.log('Base de données initialisée avec succès');
} catch (err) {
  console.error('ERREUR connexion MySQL:', err.message);
  console.error('Code:', err.code);
  process.exit(1);
}

export default pool;
