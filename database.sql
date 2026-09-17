-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.0.30 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.1.0.6537
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for disc_test
CREATE DATABASE IF NOT EXISTS `disc_test` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `disc_test`;

-- Dumping structure for table disc_test.admins
CREATE TABLE IF NOT EXISTS `admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table disc_test.admins: ~1 rows (approximately)
INSERT INTO `admins` (`id`, `username`, `password_hash`) VALUES
	(1, 'admin', '$2b$10$du2MJVpgGiRS4GSceuAWqOy7NRcFnPOGKiOV01WP3ST2L1urng0RW');

-- Dumping structure for table disc_test.answers
CREATE TABLE IF NOT EXISTS `answers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `attempt_id` int NOT NULL,
  `question_id` int NOT NULL,
  `most_option_id` int NOT NULL,
  `least_option_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `attempt_id` (`attempt_id`),
  KEY `question_id` (`question_id`),
  KEY `most_option_id` (`most_option_id`),
  KEY `least_option_id` (`least_option_id`),
  CONSTRAINT `answers_ibfk_1` FOREIGN KEY (`attempt_id`) REFERENCES `attempts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `answers_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `answers_ibfk_3` FOREIGN KEY (`most_option_id`) REFERENCES `options` (`id`),
  CONSTRAINT `answers_ibfk_4` FOREIGN KEY (`least_option_id`) REFERENCES `options` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table disc_test.answers: ~0 rows (approximately)

-- Dumping structure for table disc_test.attempts
CREATE TABLE IF NOT EXISTS `attempts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `started_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  `status` enum('in_progress','completed') DEFAULT 'in_progress',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `attempts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table disc_test.attempts: ~1 rows (approximately)
INSERT INTO `attempts` (`id`, `user_id`, `started_at`, `completed_at`, `status`) VALUES
	(2, 5, '2026-09-09 11:07:37', NULL, 'in_progress');

-- Dumping structure for table disc_test.disc_graphs
CREATE TABLE IF NOT EXISTS `disc_graphs` (
  `graph_id` int NOT NULL AUTO_INCREMENT,
  `attempt_id` int NOT NULL,
  `graph_type` enum('Graph 1 (Mask)','Graph 2 (Pressure)','Graph 3 (Self)') NOT NULL,
  `dimension` enum('D','I','S','C') NOT NULL,
  `calculated_value` int NOT NULL,
  `is_custom_number` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`graph_id`),
  KEY `attempt_id` (`attempt_id`),
  CONSTRAINT `disc_graphs_ibfk_1` FOREIGN KEY (`attempt_id`) REFERENCES `attempts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table disc_test.disc_graphs: ~0 rows (approximately)

-- Dumping structure for table disc_test.options
CREATE TABLE IF NOT EXISTS `options` (
  `id` int NOT NULL AUTO_INCREMENT,
  `question_id` int NOT NULL,
  `teks` text NOT NULL,
  `tipe_most` varchar(5) DEFAULT NULL,
  `tipe_least` varchar(5) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`),
  KEY `idx_tipe_most` (`tipe_most`),
  KEY `idx_tipe_least` (`tipe_least`),
  CONSTRAINT `options_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=97 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table disc_test.options: ~96 rows (approximately)
INSERT INTO `options` (`id`, `question_id`, `teks`, `tipe_most`, `tipe_least`) VALUES
	(1, 1, 'Mengelola waktu dengan efisien', 'C', '*'),
	(2, 1, 'Sering terburu-buru', 'D', 'D'),
	(3, 1, 'Mementingkan masalah sosial', 'I', 'I'),
	(4, 1, 'Suka menyelesaikan hal yang sudah dimulai', 'S', 'S'),
	(5, 2, 'Penyemangat / pendukung yang baik', 'I', 'I'),
	(6, 2, 'Pendengar yang baik', 'S', 'S'),
	(7, 2, 'Penganalisa yang baik', 'C', 'C'),
	(8, 2, 'Pendelegasi yang baik / pandai membagi tugas', 'D', 'D'),
	(9, 3, 'Non konfrontasi / mengalah', '*', 'S'),
	(10, 3, 'Penuh dengan hal-hal kecil / detail', 'C', '*'),
	(11, 3, 'Berubah pada menit-menit terakhir', 'I', 'I'),
	(12, 3, 'Mendesak / memaksa / sedikit kasar', 'D', 'D'),
	(13, 4, 'Ramah, mudah berteman', 'S', '*'),
	(14, 4, 'Unik, bosan dengan rutinitas', '*', 'I'),
	(15, 4, 'Aktif membuat perubahan', 'D', 'D'),
	(16, 4, 'Ingin segala sesuatu akurat dan pasti', 'C', 'C'),
	(17, 5, 'Menolak perubahan yang mendadak', 'S', '*'),
	(18, 5, 'Cenderung terlalu banyak berjanji', 'I', 'I'),
	(19, 5, 'Mundur apabila di bawah tekanan', '*', 'C'),
	(20, 5, 'Tidak takut berdebat / konfrontasi', '*', 'D'),
	(21, 6, 'Menahan diri, bisa hidup tanpa memiliki', '*', 'C'),
	(22, 6, 'Membeli karena dorongan hasrat', 'D', 'D'),
	(23, 6, 'Akan menunggu dan tidak tertekan', 'S', 'S'),
	(24, 6, 'Akan membeli apa yang diinginkan', 'I', '*'),
	(25, 7, 'Menjadi frustrasi', 'C', 'C'),
	(26, 7, 'Memendam perasaan dalam hati', 'S', 'S'),
	(27, 7, 'Menyampaikan sudut pandang pribadi', '*', 'I'),
	(28, 7, 'Berani menghadapi oposisi / berlawanan', 'D', 'D'),
	(29, 8, 'Menyemangati orang lain', 'I', 'I'),
	(30, 8, 'Berusaha mencapai kesempurnaan', '*', 'C'),
	(31, 8, 'Menjadi bagian dari tim / kelompok', '*', 'S'),
	(32, 8, 'Ingin menetapkan goal / tujuan', 'D', '*'),
	(33, 9, 'Mudah bergaul, ramah, mudah setuju', 'S', 'S'),
	(34, 9, 'Mempercayai, percaya pada orang lain', 'I', 'I'),
	(35, 9, 'Petualang, suka mengambil resiko', '*', 'D'),
	(36, 9, 'Penuh toleransi, menghormati orang lain', 'C', 'C'),
	(37, 10, 'Peraturan perlu diuji', '*', 'D'),
	(38, 10, 'Peraturan membuat menjadi adil', 'C', '*'),
	(39, 10, 'Peraturan membuat menjadi membosankan', 'I', 'I'),
	(40, 10, 'Peraturan membuat menjadi aman', 'S', 'S'),
	(41, 11, 'Lincah, banyak bicara', 'I', '*'),
	(42, 11, 'Cepat, penuh keyakinan', 'D', 'D'),
	(43, 11, 'Berusaha menjaga keseimbangan', 'S', 'S'),
	(44, 11, 'Berusaha patuh pada peraturan', '*', 'C'),
	(45, 12, 'Mementingkan hasil', 'D', 'D'),
	(46, 12, 'Mengerjakan dengan benar dan akurat', 'C', 'C'),
	(47, 12, 'Membuat pekerjaan jadi menyenangkan', '*', 'I'),
	(48, 12, 'Mari kerjakan bersama-sama', '*', 'S'),
	(49, 13, 'Pendidikan, kebudayaan', '*', 'C'),
	(50, 13, 'Prestasi, penghargaan', 'D', 'D'),
	(51, 13, 'Keselamatan, keamanan', 'S', 'S'),
	(52, 13, 'Sosial, pertemuan kelompok', 'I', '*'),
	(53, 14, 'Menginginkan kekuasaan lebih', '*', 'D'),
	(54, 14, 'Menginginkan kesempatan baru', 'I', '*'),
	(55, 14, 'Menghindari perselisihan / konflik apapun', 'S', 'S'),
	(56, 14, 'Menginginkan arahan / petunjuk yang jelas', '*', 'C'),
	(57, 15, 'Tenang, pendiam, tertutup', 'C', 'C'),
	(58, 15, 'Gembira, bebas, riang', 'I', 'I'),
	(59, 15, 'Menyenangkan, baik', 'S', '*'),
	(60, 15, 'Tegas, berani', 'D', 'D'),
	(61, 16, 'Menyenangkan orang lain, ramah', 'S', 'S'),
	(62, 16, 'Tertawa lepas, hidup', '*', 'I'),
	(63, 16, 'Pemberani, tegas', 'D', 'D'),
	(64, 16, 'Pendiam, tertutup, tenang', 'C', 'C'),
	(65, 17, 'Mengutamakan kemajuan / peningkatan', 'D', 'D'),
	(66, 17, 'Mudah merasa puas', 'S', '*'),
	(67, 17, 'Menunjukkan perasaan dengan terbuka', 'I', '*'),
	(68, 17, 'Rendah hati, sederhana', '*', 'C'),
	(69, 18, 'Memikirkan orang lain dahulu', 'S', 'S'),
	(70, 18, 'Menyukai tantangan dan persaingan', 'D', 'D'),
	(71, 18, 'Optimis, berfikir positif', 'I', 'I'),
	(72, 18, 'Berfikir logis, sistematis', '*', 'C'),
	(73, 19, 'Lembut, pendiam, tertutup', 'C', '*'),
	(74, 19, 'Optimis, visioner/pandangan ke masa depan', 'D', 'D'),
	(75, 19, 'Pusat perhatian, suka bersosialisasi', '*', 'I'),
	(76, 19, 'Pendamai, pembawa ketenangan', 'S', 'S'),
	(77, 20, 'Menyediakan waktu untuk orang lain', 'S', 'S'),
	(78, 20, 'Penuh pertimbangan dan persiapan diri', 'C', '*'),
	(79, 20, 'Melakukan petualangan', 'I', 'I'),
	(80, 20, 'Menerima penghargaan atas pencapaian target', 'D', 'D'),
	(81, 21, 'Saya akan pimpin mereka', 'D', '*'),
	(82, 21, 'Saya ikuti / menurut', 'S', 'S'),
	(83, 21, 'Saya akan bujuk mereka', 'I', 'I'),
	(84, 21, 'Saya akan dapatkan faktanya', 'C', '*'),
	(85, 22, 'Tidak mudah menyerah', 'D', 'D'),
	(86, 22, 'Melakukan sesuai perintah', 'S', '*'),
	(87, 22, 'Bersemangat riang, ceria', 'I', 'I'),
	(88, 22, 'Ingin keteraturan, rapi', '*', 'C'),
	(89, 23, 'Dapat dipercaya dan diandalkan', '*', 'S'),
	(90, 23, 'Kreatif, unik', 'I', 'I'),
	(91, 23, 'Berorientasi pada hasil', 'D', '*'),
	(92, 23, 'Memegang teguh standar tinggi', 'C', '*'),
	(93, 24, 'Pendekatan langsung dan tegas', 'D', 'D'),
	(94, 24, 'Suka bergaul, antusias', '*', 'I'),
	(95, 24, 'Mudah ditebak, konsisten', '*', 'S'),
	(96, 24, 'Waspada, berhati-hati', 'C', '*');

-- Dumping structure for table disc_test.questions
CREATE TABLE IF NOT EXISTS `questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nomor` int NOT NULL,
  `pertanyaan` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table disc_test.questions: ~24 rows (approximately)
INSERT INTO `questions` (`id`, `nomor`, `pertanyaan`) VALUES
	(1, 1, 'Pilihlah satu yang PALING (+) dan satu yang PALING TIDAK (-) menggambarkan diri Anda.'),
	(2, 2, 'Pilihlah satu yang PALING (+) dan satu yang PALING TIDAK (-) menggambarkan diri Anda.'),
	(3, 3, 'Pilihlah satu yang PALING (+) dan satu yang PALING TIDAK (-) menggambarkan diri Anda.'),
	(4, 4, 'Pilihlah satu yang PALING (+) dan satu yang PALING TIDAK (-) menggambarkan diri Anda.'),
	(5, 5, 'Pilihlah satu yang PALING (+) dan satu yang PALING TIDAK (-) menggambarkan diri Anda.'),
	(6, 6, 'Pilihlah satu yang PALING (+) dan satu yang PALING TIDAK (-) menggambarkan diri Anda.'),
	(7, 7, 'Pilihlah satu yang PALING (+) dan satu yang PALING TIDAK (-) menggambarkan diri Anda.'),
	(8, 8, 'Pilihlah satu yang PALING (+) dan satu yang PALING TIDAK (-) menggambarkan diri Anda.'),
	(9, 9, 'Pilihlah satu yang PALING (+) dan satu yang PALING TIDAK (-) menggambarkan diri Anda.'),
	(10, 10, 'Pilihlah satu yang PALING (+) dan satu yang PALING TIDAK (-) menggambarkan diri Anda.'),
	(11, 11, 'Pilihlah satu yang PALING (+) dan satu yang PALING TIDAK (-) menggambarkan diri Anda.'),
	(12, 12, 'Pilihlah satu yang PALING (+) dan satu yang PALING TIDAK (-) menggambarkan diri Anda.'),
	(13, 13, 'Pilihlah satu yang PALING (+) dan satu yang PALING TIDAK (-) menggambarkan diri Anda.'),
	(14, 14, 'Pilihlah satu yang PALING (+) dan satu yang PALING TIDAK (-) menggambarkan diri Anda.'),
	(15, 15, 'Pilihlah satu yang PALING (+) dan satu yang PALING TIDAK (-) menggambarkan diri Anda.'),
	(16, 16, 'Pilihlah satu yang PALING (+) dan satu yang PALING TIDAK (-) menggambarkan diri Anda.'),
	(17, 17, 'Pilihlah satu yang PALING (+) dan satu yang PALING TIDAK (-) menggambarkan diri Anda.'),
	(18, 18, 'Pilihlah satu yang PALING (+) dan satu yang PALING TIDAK (-) menggambarkan diri Anda.'),
	(19, 19, 'Pilihlah satu yang PALING (+) dan satu yang PALING TIDAK (-) menggambarkan diri Anda.'),
	(20, 20, 'Pilihlah satu yang PALING (+) dan satu yang PALING TIDAK (-) menggambarkan diri Anda.'),
	(21, 21, 'Pilihlah satu yang PALING (+) dan satu yang PALING TIDAK (-) menggambarkan diri Anda.'),
	(22, 22, 'Pilihlah satu yang PALING (+) dan satu yang PALING TIDAK (-) menggambarkan diri Anda.'),
	(23, 23, 'Pilihlah satu yang PALING (+) dan satu yang PALING TIDAK (-) menggambarkan diri Anda.'),
	(24, 24, 'Pilihlah satu yang PALING (+) dan satu yang PALING TIDAK (-) menggambarkan diri Anda.');

-- Dumping structure for table disc_test.results
CREATE TABLE IF NOT EXISTS `results` (
  `id` int NOT NULL AUTO_INCREMENT,
  `attempt_id` int NOT NULL,
  `most_d` int DEFAULT '0',
  `most_i` int DEFAULT '0',
  `most_s` int DEFAULT '0',
  `most_c` int DEFAULT '0',
  `most_star` int DEFAULT '0',
  `least_d` int DEFAULT '0',
  `least_i` int DEFAULT '0',
  `least_s` int DEFAULT '0',
  `least_c` int DEFAULT '0',
  `least_star` int DEFAULT '0',
  `change_d` int DEFAULT '0',
  `change_i` int DEFAULT '0',
  `change_s` int DEFAULT '0',
  `change_c` int DEFAULT '0',
  `change_star` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `attempt_id` (`attempt_id`),
  CONSTRAINT `results_ibfk_1` FOREIGN KEY (`attempt_id`) REFERENCES `attempts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table disc_test.results: ~0 rows (approximately)

-- Dumping structure for table disc_test.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama_lengkap` varchar(100) NOT NULL,
  `umur` int DEFAULT NULL,
  `pendidikan_terakhir` varchar(100) DEFAULT NULL,
  `pekerjaan` varchar(100) DEFAULT NULL,
  `jenis_kelamin` enum('Laki-laki','Perempuan') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table disc_test.users: ~1 rows (approximately)
INSERT INTO `users` (`id`, `nama_lengkap`, `umur`, `pendidikan_terakhir`, `pekerjaan`, `jenis_kelamin`, `created_at`) VALUES
	(5, 'yendy', 21, 'SMA / SMK Sederajat', 'magang', 'Laki-laki', '2026-09-08 21:07:37');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
