-- =====================================================
-- FIXED ALL-IN-ONE SQL
-- Source DB: uxi
-- Target DB: ngocthienwedding
-- Purpose: create schema + migrate important data + seed consultations
-- Run: C:\xampp\mysql\bin\mysql.exe -u root < backend/database/fixed_ngocthienwedding.sql
-- =====================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS ngocthienwedding
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ngocthienwedding;

-- =====================================================
-- 1) CORE TABLES (compatible with backend Sequelize models)
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  source_user_id INT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NULL,
  phone VARCHAR(20) NULL,
  address TEXT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_users_source_user_id (source_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  source_product_id INT NULL,
  vendor_id INT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  price BIGINT NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  category_id INT NULL,
  image_urls JSON NULL,
  cover VARCHAR(255) NULL,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  average_rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  review_count INT NOT NULL DEFAULT 0,
  service_details TEXT NULL,
  unit VARCHAR(50) NULL,
  origin VARCHAR(100) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_products_source_product_id (source_product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  source_order_id INT NULL,
  user_id INT NOT NULL,
  order_code VARCHAR(50) NOT NULL UNIQUE,
  total_amount BIGINT NOT NULL DEFAULT 0,
  status ENUM('pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
  delivery_address TEXT NULL,
  phone VARCHAR(20) NULL,
  email VARCHAR(100) NULL,
  payment_method VARCHAR(50) NULL,
  payment_status ENUM('pending', 'paid', 'failed') NOT NULL DEFAULT 'pending',
  customer_name VARCHAR(255) NULL,
  vendor_id INT NULL,
  cancel_reason VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_orders_source_order_id (source_order_id),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  source_order_item_id INT NULL,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price BIGINT NOT NULL,
  subtotal BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_order_items_source_order_item_id (source_order_item_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS shopping_carts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_shopping_cart_user_product (user_id, product_id),
  CONSTRAINT fk_shopping_carts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_shopping_carts_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  source_review_id INT NULL,
  product_id INT NOT NULL,
  user_id INT NULL,
  reviewer_name VARCHAR(255) NOT NULL,
  rating TINYINT NOT NULL,
  comment TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_product_reviews_source_review_id (source_review_id),
  INDEX idx_product_reviews_product_id (product_id),
  INDEX idx_product_reviews_user_id (user_id),
  CONSTRAINT fk_product_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_product_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_product_reviews_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS consultations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  service TEXT NULL,
  event_date DATETIME NULL,
  note TEXT NULL,
  status ENUM('pending', 'confirmed', 'processing', 'delivering', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_consultations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS live_chat_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  source_conversation_id INT NULL,
  chat_session VARCHAR(100) NOT NULL UNIQUE,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(100) NULL,
  customer_phone VARCHAR(20) NULL,
  user_id INT NULL,
  status ENUM('active', 'closed') NOT NULL DEFAULT 'active',
  is_read_by_admin TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_live_chat_sessions_source_conversation_id (source_conversation_id),
  CONSTRAINT fk_live_chat_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS live_chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  source_message_id INT NULL,
  chat_session VARCHAR(100) NOT NULL,
  sender_type ENUM('customer', 'admin') NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_live_chat_messages_source_message_id (source_message_id),
  INDEX idx_live_chat_messages_chat_session (chat_session),
  CONSTRAINT fk_live_chat_messages_session FOREIGN KEY (chat_session) REFERENCES live_chat_sessions(chat_session) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS homepage_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  gallery_images JSON NULL,
  header_slider_images JSON NULL,
  hero_background_image VARCHAR(255) NULL,
  consult_image VARCHAR(255) NULL,
  image_history JSON NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ensure critical columns/indexes exist in older schemas.
ALTER TABLE users ADD COLUMN IF NOT EXISTS source_user_id INT NULL;
ALTER TABLE users ADD UNIQUE INDEX IF NOT EXISTS uk_users_source_user_id (source_user_id);

ALTER TABLE products ADD COLUMN IF NOT EXISTS source_product_id INT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS vendor_id INT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit VARCHAR(50) NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS origin VARCHAR(100) NULL;
ALTER TABLE products ADD UNIQUE INDEX IF NOT EXISTS uk_products_source_product_id (source_product_id);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS source_order_id INT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS vendor_id INT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_reason VARCHAR(500) NULL;
ALTER TABLE orders ADD UNIQUE INDEX IF NOT EXISTS uk_orders_source_order_id (source_order_id);

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS source_order_item_id INT NULL;
ALTER TABLE order_items ADD UNIQUE INDEX IF NOT EXISTS uk_order_items_source_order_item_id (source_order_item_id);

ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS source_review_id INT NULL;
ALTER TABLE product_reviews ADD UNIQUE INDEX IF NOT EXISTS uk_product_reviews_source_review_id (source_review_id);
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS product_id INT NOT NULL;
ALTER TABLE product_reviews ADD INDEX IF NOT EXISTS idx_product_reviews_product_id (product_id);

ALTER TABLE live_chat_sessions ADD COLUMN IF NOT EXISTS source_conversation_id INT NULL;
ALTER TABLE live_chat_sessions ADD UNIQUE INDEX IF NOT EXISTS uk_live_chat_sessions_source_conversation_id (source_conversation_id);

ALTER TABLE live_chat_messages ADD COLUMN IF NOT EXISTS source_message_id INT NULL;
ALTER TABLE live_chat_messages ADD UNIQUE INDEX IF NOT EXISTS uk_live_chat_messages_source_message_id (source_message_id);

-- =====================================================
-- 2) MIGRATE IMPORTANT DATA FROM UXI
-- =====================================================

-- Refresh previously migrated data (idempotent full sync from uxi).
DELETE FROM ngocthienwedding.live_chat_messages WHERE source_message_id IS NOT NULL;
DELETE FROM ngocthienwedding.live_chat_sessions WHERE source_conversation_id IS NOT NULL;
DELETE FROM ngocthienwedding.product_reviews WHERE source_review_id IS NOT NULL;
DELETE FROM ngocthienwedding.order_items WHERE source_order_item_id IS NOT NULL;
DELETE FROM ngocthienwedding.orders WHERE source_order_id IS NOT NULL;
DELETE FROM ngocthienwedding.products WHERE source_product_id IS NOT NULL;
DELETE FROM ngocthienwedding.users WHERE source_user_id IS NOT NULL;

SET @has_src_orders = (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = 'uxi' AND table_name = 'orders'
);

SET @has_src_users = (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = 'uxi' AND table_name = 'users'
);

SET @has_src_products = (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = 'uxi' AND table_name = 'products'
);

SET @has_src_order_items = (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = 'uxi' AND table_name = 'order_items'
);

SET @has_src_reviews = (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = 'uxi' AND table_name = 'reviews'
);

SET @has_src_conversations = (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = 'uxi' AND table_name = 'conversations'
);

SET @has_src_messages = (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = 'uxi' AND table_name = 'messages'
);

SET @has_src_system_banners = (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = 'uxi' AND table_name = 'system_banners'
);

SET @has_src_promo_banners = (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = 'uxi' AND table_name = 'promo_banners'
);

-- 2.1 Users from uxi.users (canonical source)
SET @sql_users = IF(
  @has_src_users > 0,
  'INSERT INTO ngocthienwedding.users (source_user_id, username, email, password, full_name, phone, address, role, is_active, created_at, updated_at)
   SELECT su.id,
          CONCAT(''uxi_user_'', su.id),
          COALESCE(NULLIF(su.email, ''''), CONCAT(''uxi_user_'', su.id, ''@ngocthienwedding.local'')),
          su.password,
          su.name,
          su.phone,
          su.address,
          CASE WHEN su.role = ''admin'' THEN ''admin'' ELSE ''user'' END,
          CASE WHEN su.role = ''vendor'' THEN COALESCE(su.is_approved, 1) ELSE 1 END,
          su.created_at,
          su.updated_at
   FROM uxi.users su
   LEFT JOIN ngocthienwedding.users u ON u.source_user_id = su.id
   WHERE u.id IS NULL',
  'SELECT ''SKIP users migration: source table uxi.users not found'' AS info'
);
PREPARE stmt_users FROM @sql_users;
EXECUTE stmt_users;
DEALLOCATE PREPARE stmt_users;

-- 2.1b Fallback users from uxi.orders if missing from uxi.users
SET @sql_users_fallback = IF(
  @has_src_orders > 0,
  'INSERT INTO ngocthienwedding.users (source_user_id, username, email, password, full_name, phone, role, is_active, created_at, updated_at)
   SELECT o.customer_id,
          CONCAT(''uxi_user_'', o.customer_id),
          CONCAT(''uxi_user_'', o.customer_id, ''@ngocthienwedding.local''),
          ''$2a$10$N9qo8uLOickgxzAxmHXJfOF/R3VHQgC6bX9qoKNVvTGfvz0I9oEMS'',
          COALESCE(NULLIF(o.customer_name, ''''), CONCAT(''Customer '', o.customer_id)),
          o.customer_phone,
          ''user'',
          1,
          NOW(),
          NOW()
   FROM (SELECT DISTINCT customer_id, customer_name, customer_phone FROM uxi.orders WHERE customer_id IS NOT NULL) o
   LEFT JOIN ngocthienwedding.users u ON u.source_user_id = o.customer_id
   WHERE u.id IS NULL',
  'SELECT ''SKIP fallback users migration: source table uxi.orders not found'' AS info'
);
PREPARE stmt_users_fallback FROM @sql_users_fallback;
EXECUTE stmt_users_fallback;
DEALLOCATE PREPARE stmt_users_fallback;

-- 2.2 Products
SET @sql_products = IF(
  @has_src_products > 0,
  'INSERT INTO ngocthienwedding.products
     (source_product_id, vendor_id, name, description, price, stock, category_id, image_urls, cover, is_featured, average_rating, review_count, service_details, unit, origin, created_at, updated_at)
     SELECT p.id,
       vu.id,
          p.name,
          p.description,
          p.price,
          p.stock,
          NULL,
          IF(JSON_VALID(p.images), p.images, ''[]''),
          NULL,
          CASE WHEN p.approval_status = ''approved'' AND p.is_banned = 0 THEN 1 ELSE 0 END,
          0,
          0,
          p.description,
          p.unit,
          p.origin,
          p.created_at,
          p.updated_at
   FROM uxi.products p
  LEFT JOIN ngocthienwedding.users vu ON vu.source_user_id = p.vendor_id
   LEFT JOIN ngocthienwedding.products tp ON tp.source_product_id = p.id
   WHERE tp.id IS NULL',
  'SELECT ''SKIP products migration: source table uxi.products not found'' AS info'
);
PREPARE stmt_products FROM @sql_products;
EXECUTE stmt_products;
DEALLOCATE PREPARE stmt_products;

-- 2.3 Orders
SET @sql_orders = IF(
  @has_src_orders > 0,
  'INSERT INTO ngocthienwedding.orders
     (source_order_id, user_id, order_code, total_amount, status, delivery_address, phone, email, payment_method, payment_status, customer_name, vendor_id, cancel_reason, created_at, updated_at)
   SELECT o.id,
          cu.id,
          o.order_code,
          o.total_amount,
          CASE
            WHEN o.delivery_status IN (''Đã giao hàng'', ''Da giao hang'') THEN ''delivered''
            WHEN o.delivery_status IN (''Đang giao hàng'', ''Dang giao hang'') THEN ''shipping''
            WHEN o.delivery_status IN (''Đã hủy'', ''Da huy'') THEN ''cancelled''
            WHEN o.delivery_status IN (''Chờ lấy hàng'', ''Cho lay hang'') THEN ''pending''
            ELSE ''pending''
          END,
          o.shipping_address,
          o.customer_phone,
          cu.email,
          o.payment_method,
          CASE
            WHEN o.payment_status IN (''Đã thanh toán'', ''Da thanh toan'') THEN ''paid''
            WHEN o.payment_status IN (''Hủy'', ''Huy'') THEN ''failed''
            ELSE ''pending''
          END,
          o.customer_name,
             vu.id,
          o.cancel_reason,
          o.created_at,
          o.updated_at
   FROM uxi.orders o
           JOIN ngocthienwedding.users cu ON cu.source_user_id = o.customer_id
           LEFT JOIN ngocthienwedding.users vu ON vu.source_user_id = o.vendor_id
   LEFT JOIN ngocthienwedding.orders to2 ON to2.source_order_id = o.id
   LEFT JOIN ngocthienwedding.orders toc ON toc.order_code = o.order_code
   WHERE to2.id IS NULL
     AND toc.id IS NULL',
  'SELECT ''SKIP orders migration: source table uxi.orders not found'' AS info'
);
PREPARE stmt_orders FROM @sql_orders;
EXECUTE stmt_orders;
DEALLOCATE PREPARE stmt_orders;

-- 2.3b Reconcile existing target orders by order_code (for legacy rows created before source tracking)
SET @sql_orders_reconcile = IF(
  @has_src_orders > 0,
  'UPDATE ngocthienwedding.orders t
  JOIN uxi.orders s ON s.order_code COLLATE utf8mb4_unicode_ci = t.order_code
   LEFT JOIN ngocthienwedding.users cu ON cu.source_user_id = s.customer_id
   LEFT JOIN ngocthienwedding.users vu ON vu.source_user_id = s.vendor_id
   SET t.source_order_id = s.id,
       t.user_id = COALESCE(cu.id, t.user_id),
       t.vendor_id = COALESCE(vu.id, t.vendor_id),
       t.customer_name = COALESCE(s.customer_name, t.customer_name),
       t.phone = COALESCE(s.customer_phone, t.phone),
       t.delivery_address = COALESCE(s.shipping_address, t.delivery_address),
       t.total_amount = s.total_amount,
       t.payment_method = s.payment_method,
       t.payment_status = CASE
         WHEN s.payment_status IN (''Đã thanh toán'', ''Da thanh toan'') THEN ''paid''
         WHEN s.payment_status IN (''Hủy'', ''Huy'') THEN ''failed''
         ELSE ''pending''
       END,
       t.status = CASE
         WHEN s.delivery_status IN (''Đã giao hàng'', ''Da giao hang'') THEN ''delivered''
         WHEN s.delivery_status IN (''Đang giao hàng'', ''Dang giao hang'') THEN ''shipping''
         WHEN s.delivery_status IN (''Đã hủy'', ''Da huy'') THEN ''cancelled''
         WHEN s.delivery_status IN (''Chờ lấy hàng'', ''Cho lay hang'') THEN ''pending''
         ELSE ''pending''
       END,
       t.cancel_reason = COALESCE(s.cancel_reason, t.cancel_reason),
       t.updated_at = NOW()
   WHERE t.source_order_id IS NULL',
  'SELECT ''SKIP order reconcile: source table uxi.orders not found'' AS info'
);
PREPARE stmt_orders_reconcile FROM @sql_orders_reconcile;
EXECUTE stmt_orders_reconcile;
DEALLOCATE PREPARE stmt_orders_reconcile;

-- 2.4a Ensure product mapping exists for every uxi.order_items.product_id
SET @sql_placeholder_products = IF(
  @has_src_order_items > 0,
  'INSERT INTO ngocthienwedding.products
     (source_product_id, vendor_id, name, description, price, stock, category_id, image_urls, cover, is_featured, average_rating, review_count, service_details, unit, origin, created_at, updated_at)
   SELECT oi.product_id,
          NULL,
          MAX(oi.product_name),
          CONCAT(''Auto-created from order_items for source product #'', oi.product_id),
          MAX(oi.price),
          0,
          NULL,
          ''[]'',
          NULL,
          0,
          0,
          0,
          MAX(oi.product_name),
          MAX(oi.unit),
          NULL,
          NOW(),
          NOW()
   FROM uxi.order_items oi
   LEFT JOIN ngocthienwedding.products tp ON tp.source_product_id = oi.product_id
   WHERE tp.id IS NULL
   GROUP BY oi.product_id',
  'SELECT ''SKIP placeholder products: source table uxi.order_items not found'' AS info'
);
PREPARE stmt_placeholder_products FROM @sql_placeholder_products;
EXECUTE stmt_placeholder_products;
DEALLOCATE PREPARE stmt_placeholder_products;

-- 2.4 Order items (mapped by source ids)
SET @sql_order_items = IF(
  @has_src_order_items > 0 AND @has_src_orders > 0 AND @has_src_products > 0,
  'INSERT INTO ngocthienwedding.order_items
     (source_order_item_id, order_id, product_id, quantity, price, subtotal, created_at)
   SELECT oi.id,
          to2.id,
          tp.id,
          oi.quantity,
          oi.price,
          (oi.quantity * oi.price),
          NOW()
   FROM uxi.order_items oi
   JOIN ngocthienwedding.orders to2 ON to2.source_order_id = oi.order_id
   JOIN ngocthienwedding.products tp ON tp.source_product_id = oi.product_id
   LEFT JOIN ngocthienwedding.order_items toi ON toi.source_order_item_id = oi.id
   WHERE toi.id IS NULL',
  'SELECT ''SKIP order_items migration: source tables missing'' AS info'
);
PREPARE stmt_order_items FROM @sql_order_items;
EXECUTE stmt_order_items;
DEALLOCATE PREPARE stmt_order_items;

-- 2.5 Product reviews from uxi.reviews (only product-target reviews)
SET @sql_reviews = IF(
  @has_src_reviews > 0,
  'INSERT INTO ngocthienwedding.product_reviews
     (source_review_id, product_id, user_id, reviewer_name, rating, comment, created_at, updated_at)
   SELECT r.id,
          tp.id,
          cu.id,
          COALESCE(cu.full_name, CONCAT(''User '', r.customer_id)),
          LEAST(GREATEST(r.rating, 1), 5),
          r.comment,
          r.created_at,
          r.created_at
   FROM uxi.reviews r
   JOIN ngocthienwedding.products tp ON tp.source_product_id = r.product_id
   LEFT JOIN ngocthienwedding.users cu ON cu.source_user_id = r.customer_id
   LEFT JOIN ngocthienwedding.product_reviews tr ON tr.source_review_id = r.id
   WHERE tr.id IS NULL
     AND r.target_type = ''product''
     AND r.product_id IS NOT NULL',
  'SELECT ''SKIP reviews migration: source table uxi.reviews not found'' AS info'
);
PREPARE stmt_reviews FROM @sql_reviews;
EXECUTE stmt_reviews;
DEALLOCATE PREPARE stmt_reviews;

-- 2.6 Live chat sessions from uxi.conversations
SET @sql_chat_sessions = IF(
  @has_src_conversations > 0,
  'INSERT INTO ngocthienwedding.live_chat_sessions
     (source_conversation_id, chat_session, customer_name, customer_email, customer_phone, user_id, status, is_read_by_admin, created_at, updated_at)
   SELECT c.id,
          CONCAT(''uxi-conv-'', c.id),
          COALESCE(cu.full_name, CONCAT(''User '', c.user_one)),
          cu.email,
          cu.phone,
          cu.id,
          ''active'',
          0,
          c.created_at,
          c.last_time
   FROM uxi.conversations c
   LEFT JOIN ngocthienwedding.users cu ON cu.source_user_id = c.user_one
   LEFT JOIN ngocthienwedding.live_chat_sessions ls ON ls.source_conversation_id = c.id
   WHERE ls.id IS NULL',
  'SELECT ''SKIP chat sessions migration: source table uxi.conversations not found'' AS info'
);
PREPARE stmt_chat_sessions FROM @sql_chat_sessions;
EXECUTE stmt_chat_sessions;
DEALLOCATE PREPARE stmt_chat_sessions;

-- 2.7 Live chat messages from uxi.messages
SET @sql_chat_messages = IF(
  @has_src_messages > 0 AND @has_src_conversations > 0,
  'INSERT INTO ngocthienwedding.live_chat_messages
     (source_message_id, chat_session, sender_type, sender_name, message, created_at)
   SELECT m.id,
          CONCAT(''uxi-conv-'', m.conversation_id),
          CASE WHEN su.role = ''admin'' THEN ''admin'' ELSE ''customer'' END,
          COALESCE(su.full_name, CONCAT(''User '', m.sender_id)),
          COALESCE(m.message_text, ''''),
          m.created_at
   FROM uxi.messages m
   LEFT JOIN ngocthienwedding.users su ON su.source_user_id = m.sender_id
   LEFT JOIN ngocthienwedding.live_chat_messages lm ON lm.source_message_id = m.id
   JOIN ngocthienwedding.live_chat_sessions ls ON ls.source_conversation_id = m.conversation_id
   WHERE lm.id IS NULL',
  'SELECT ''SKIP chat messages migration: source tables missing'' AS info'
);
PREPARE stmt_chat_messages FROM @sql_chat_messages;
EXECUTE stmt_chat_messages;
DEALLOCATE PREPARE stmt_chat_messages;

-- 2.8 Homepage configs from banner tables (if config row does not exist)
SET @sql_homepage = IF(
  @has_src_system_banners > 0 OR @has_src_promo_banners > 0,
  'INSERT INTO ngocthienwedding.homepage_configs
     (id, gallery_images, header_slider_images, hero_background_image, consult_image, image_history, updated_at)
   SELECT 1,
          COALESCE((SELECT JSON_ARRAYAGG(pb.image_path ORDER BY pb.position) FROM uxi.promo_banners pb), JSON_ARRAY()),
          COALESCE((SELECT JSON_ARRAYAGG(pb2.image_path ORDER BY pb2.position) FROM uxi.promo_banners pb2), JSON_ARRAY()),
          COALESCE((SELECT sb.image_path FROM uxi.system_banners sb WHERE sb.banner_key = ''user_hero'' LIMIT 1), ''''),
          COALESCE((SELECT sb2.image_path FROM uxi.system_banners sb2 WHERE sb2.banner_key = ''register'' LIMIT 1), ''''),
          ''{}'',
          NOW()
   FROM DUAL
   WHERE NOT EXISTS (SELECT 1 FROM ngocthienwedding.homepage_configs WHERE id = 1)',
  'SELECT ''SKIP homepage migration: source banner tables not found'' AS info'
);
PREPARE stmt_homepage FROM @sql_homepage;
EXECUTE stmt_homepage;
DEALLOCATE PREPARE stmt_homepage;

-- =====================================================
-- 3) CONSULTATION DEFAULT SEED (only if table is empty)
-- =====================================================

INSERT INTO ngocthienwedding.consultations
  (user_id, name, email, phone, service, event_date, note, status, is_read, created_at, updated_at)
SELECT
  NULL,
  'Nguyen Van A',
  'nva@example.com',
  '0123456789',
  'Trang tri tiec cuoi',
  '2026-06-20 10:00:00',
  'Muon tu van chi phi',
  'pending',
  0,
  NOW(),
  NOW()
FROM DUAL
WHERE (SELECT COUNT(*) FROM ngocthienwedding.consultations) = 0;

INSERT INTO ngocthienwedding.consultations
  (user_id, name, email, phone, service, event_date, note, status, is_read, created_at, updated_at)
SELECT
  NULL,
  'Tran Thi B',
  'ttb@example.com',
  '0987654321',
  'Chup anh cuoi',
  '2026-07-05 14:00:00',
  'Can thong tin goi chup',
  'pending',
  0,
  NOW(),
  NOW()
FROM DUAL
WHERE (SELECT COUNT(*) FROM ngocthienwedding.consultations) = 1;

-- =====================================================
-- 4) RESULT CHECK
-- =====================================================

SELECT 'DONE: fixed_ngocthienwedding.sql' AS status;
SELECT 'products' AS table_name, COUNT(*) AS total FROM ngocthienwedding.products
UNION ALL
SELECT 'orders', COUNT(*) FROM ngocthienwedding.orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM ngocthienwedding.order_items
UNION ALL
SELECT 'users', COUNT(*) FROM ngocthienwedding.users
UNION ALL
SELECT 'consultations', COUNT(*) FROM ngocthienwedding.consultations;

SET FOREIGN_KEY_CHECKS = 1;
