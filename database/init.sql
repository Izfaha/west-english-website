CREATE TABLE IF NOT EXISTS `west_leads` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nama` VARCHAR(255) NOT NULL,
  `jenis_kelamin` VARCHAR(20) NOT NULL,
  `umur` INT NOT NULL,
  `ttl` VARCHAR(255) NOT NULL,
  `alamat` TEXT NOT NULL,
  `whatsapp` VARCHAR(30) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `program` VARCHAR(100) NOT NULL,
  `level` VARCHAR(50) NOT NULL,
  `voucher_code` VARCHAR(50) DEFAULT NULL,
  `discount_amount` INT DEFAULT 0,
  `total_bayar` INT NOT NULL,
  `status_bayar` VARCHAR(20) DEFAULT 'Pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `west_vouchers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `discount_1bulan` INT NOT NULL DEFAULT 51000,
  `discount_2minggu` INT NOT NULL DEFAULT 65000,
  `expires_at` DATETIME DEFAULT NULL,
  `is_used` TINYINT(1) DEFAULT 0,
  `used_by_lead_id` INT DEFAULT NULL,
  `used_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`used_by_lead_id`) REFERENCES `west_leads`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
