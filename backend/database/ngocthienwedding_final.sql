-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: ngocthienwedding
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `consultations`
--

DROP TABLE IF EXISTS `consultations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `consultations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `service` text DEFAULT NULL,
  `event_date` datetime DEFAULT NULL,
  `note` text DEFAULT NULL,
  `status` enum('pending','confirmed','processing','delivering','completed','cancelled') NOT NULL DEFAULT 'pending',
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_consultations_user` (`user_id`),
  CONSTRAINT `fk_consultations_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultations`
--

LOCK TABLES `consultations` WRITE;
/*!40000 ALTER TABLE `consultations` DISABLE KEYS */;
INSERT INTO `consultations` VALUES (1,NULL,'Nguyen Van A','nva@example.com','0123456789','Trang tri tiec cuoi','2026-06-20 10:00:00','Muon tu van chi phi','pending',0,'2026-05-13 15:46:53','2026-05-13 15:46:53'),(2,NULL,'Tran Thi B','ttb@example.com','0987654321','Chup anh cuoi','2026-07-05 14:00:00','Can thong tin goi chup','pending',0,'2026-05-13 15:46:53','2026-05-13 15:46:53'),(3,NULL,'John Doe','john@test.com','0987654321','',NULL,'','pending',0,'2026-05-13 15:54:04','2026-05-13 15:54:04');
/*!40000 ALTER TABLE `consultations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `homepage_configs`
--

DROP TABLE IF EXISTS `homepage_configs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `homepage_configs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `gallery_images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`gallery_images`)),
  `header_slider_images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`header_slider_images`)),
  `hero_background_image` varchar(255) DEFAULT NULL,
  `consult_image` varchar(255) DEFAULT NULL,
  `image_history` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`image_history`)),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `homepage_configs`
--

LOCK TABLES `homepage_configs` WRITE;
/*!40000 ALTER TABLE `homepage_configs` DISABLE KEYS */;
/*!40000 ALTER TABLE `homepage_configs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `live_chat_messages`
--

DROP TABLE IF EXISTS `live_chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `live_chat_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source_message_id` int(11) DEFAULT NULL,
  `chat_session` varchar(100) NOT NULL,
  `sender_type` enum('customer','admin') NOT NULL,
  `sender_name` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_live_chat_messages_source_message_id` (`source_message_id`),
  KEY `idx_live_chat_messages_chat_session` (`chat_session`),
  CONSTRAINT `fk_live_chat_messages_session` FOREIGN KEY (`chat_session`) REFERENCES `live_chat_sessions` (`chat_session`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `live_chat_messages`
--

LOCK TABLES `live_chat_messages` WRITE;
/*!40000 ALTER TABLE `live_chat_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `live_chat_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `live_chat_sessions`
--

DROP TABLE IF EXISTS `live_chat_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `live_chat_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source_conversation_id` int(11) DEFAULT NULL,
  `chat_session` varchar(100) NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `customer_email` varchar(100) DEFAULT NULL,
  `customer_phone` varchar(20) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `status` enum('active','closed') NOT NULL DEFAULT 'active',
  `is_read_by_admin` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `chat_session` (`chat_session`),
  UNIQUE KEY `uk_live_chat_sessions_source_conversation_id` (`source_conversation_id`),
  KEY `fk_live_chat_sessions_user` (`user_id`),
  CONSTRAINT `fk_live_chat_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `live_chat_sessions`
--

LOCK TABLES `live_chat_sessions` WRITE;
/*!40000 ALTER TABLE `live_chat_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `live_chat_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source_order_item_id` int(11) DEFAULT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `price` bigint(20) NOT NULL,
  `subtotal` bigint(20) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_items_source_order_item_id` (`source_order_item_id`),
  KEY `fk_order_items_order` (`order_id`),
  KEY `fk_order_items_product` (`product_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source_order_id` int(11) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `order_code` varchar(50) NOT NULL,
  `total_amount` bigint(20) NOT NULL DEFAULT 0,
  `status` enum('pending','confirmed','processing','shipping','delivered','cancelled') NOT NULL DEFAULT 'pending',
  `delivery_address` text DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `payment_status` enum('pending','paid','failed') NOT NULL DEFAULT 'pending',
  `customer_name` varchar(255) DEFAULT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `cancel_reason` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_code` (`order_code`),
  UNIQUE KEY `uk_orders_source_order_id` (`source_order_id`),
  KEY `fk_orders_user` (`user_id`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_reviews`
--

DROP TABLE IF EXISTS `product_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `product_reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source_review_id` int(11) DEFAULT NULL,
  `product_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `reviewer_name` varchar(255) NOT NULL,
  `rating` tinyint(4) NOT NULL,
  `comment` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_reviews_source_review_id` (`source_review_id`),
  KEY `idx_product_reviews_product_id` (`product_id`),
  KEY `idx_product_reviews_user_id` (`user_id`),
  CONSTRAINT `fk_product_reviews_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_product_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_product_reviews_rating` CHECK (`rating` between 1 and 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_reviews`
--

LOCK TABLES `product_reviews` WRITE;
/*!40000 ALTER TABLE `product_reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source_product_id` int(11) DEFAULT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` bigint(20) NOT NULL DEFAULT 0,
  `stock` int(11) NOT NULL DEFAULT 0,
  `category_id` int(11) DEFAULT NULL,
  `image_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`image_urls`)),
  `cover` varchar(255) DEFAULT NULL,
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `average_rating` decimal(3,2) NOT NULL DEFAULT 0.00,
  `review_count` int(11) NOT NULL DEFAULT 0,
  `service_details` text DEFAULT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `origin` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_products_source_product_id` (`source_product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shopping_carts`
--

DROP TABLE IF EXISTS `shopping_carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `shopping_carts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_shopping_cart_user_product` (`user_id`,`product_id`),
  KEY `fk_shopping_carts_product` (`product_id`),
  CONSTRAINT `fk_shopping_carts_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_shopping_carts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shopping_carts`
--

LOCK TABLES `shopping_carts` WRITE;
/*!40000 ALTER TABLE `shopping_carts` DISABLE KEYS */;
/*!40000 ALTER TABLE `shopping_carts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source_user_id` int(11) DEFAULT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `uk_users_source_user_id` (`source_user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,NULL,'testuser1','test1@test.com','$2b$10$StcJ20CzkGRRV7qJI49aYuDLSxsL9HuO4Re3THagV0o9iiD6c634u','',NULL,NULL,NULL,'user',1,'2026-05-13 15:53:38','2026-05-13 15:53:38'),(2,NULL,'Đại Văn ','dai_2251220039@dau.edu.vn','$2b$10$QFEixJTPxaWQHWWyBoyJjO3Ja8wY616x18A.MDnUN6cItc2C/uY.y','',NULL,NULL,NULL,'admin',1,'2026-05-13 16:02:36','2026-05-13 16:03:50'),(3,NULL,'Vanphudai24122004@gmail.com','Vanphudai24122004@gmail.com','$2b$10$VRqyOWuPaabMF/qMj487/u2WkAHHo37xPQTqSHJkJhuFeYQz5QpGq','',NULL,NULL,NULL,'user',1,'2026-05-13 16:28:04','2026-05-13 16:28:04');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-18 13:29:41
