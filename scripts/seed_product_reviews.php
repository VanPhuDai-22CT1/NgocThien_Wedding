<?php

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$names = [
    'Nguyễn Thị Thu Quyên',
    'Trần Minh Khoa',
    'Lê Hoàng Ngân',
    'Phạm Quỳnh Anh',
    'Võ Gia Hưng',
    'Đặng Ngọc Ánh',
    'Nguyễn Quốc Bảo',
    'Bùi Thanh Trúc',
    'Phan Tuấn Kiệt',
    'Mai Khánh Linh',
    'Huỳnh Gia Bảo',
    'Dương Minh Thảo',
    'Ngô Thanh Tùng',
    'Lý Thảo Nguyên',
    'Trương Nhật Hạ',
    'Phạm Gia Hân',
    'Đoàn Hoàng Phúc',
    'Tạ Minh Nguyệt',
    'Nguyễn Hải Đăng',
    'Trịnh Thu Hà'
];

$comments = [
    'Dịch vụ rất chuyên nghiệp, ekip hỗ trợ nhanh và đúng giờ. Gia đình mình rất hài lòng.',
    'Chất lượng vượt mong đợi, trang trí đẹp và tinh tế. Sẽ giới thiệu thêm bạn bè.',
    'Tư vấn rõ ràng, làm việc có tâm, bám sát kế hoạch đến ngày tổ chức.',
    'Mọi hạng mục đều chuẩn chỉnh, đúng như cam kết ban đầu. Đánh giá 5 sao.',
    'Nhân viên hỗ trợ tận tình từ khâu chuẩn bị đến hoàn thiện, cảm ơn đội ngũ rất nhiều.',
    'Giá hợp lý so với chất lượng nhận được, quy trình làm việc rất chuyên nghiệp.',
    'Dịch vụ ổn định, đúng tiến độ, giao tiếp dễ chịu và xử lý phát sinh rất tốt.',
    'Sản phẩm đẹp hơn mong đợi, gia đình hai bên đều khen. Rất đáng tiền.',
    'Đội ngũ làm việc trách nhiệm, đúng lịch và hỗ trợ tận tâm. Chắc chắn sẽ quay lại.',
    'Tổng thể trải nghiệm rất tốt, chất lượng đồng đều, mọi thứ diễn ra suôn sẻ.'
];

function pick_random(array $arr)
{
    return $arr[array_rand($arr)];
}

try {
    $conn = new mysqli('localhost', 'root', '', 'uxi');
    $conn->set_charset('utf8mb4');

    $conn->query("\n        CREATE TABLE IF NOT EXISTS product_reviews (\n            id INT AUTO_INCREMENT PRIMARY KEY,\n            product_id INT NOT NULL,\n            user_id INT DEFAULT NULL,\n            reviewer_name VARCHAR(255) NOT NULL,\n            rating TINYINT NOT NULL,\n            comment TEXT DEFAULT NULL,\n            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n            INDEX idx_product_reviews_product_id (product_id),\n            INDEX idx_product_reviews_user_id (user_id)\n        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci\n    ");

    $productsRes = $conn->query("SELECT id, name FROM products ORDER BY id ASC");
    $products = [];
    while ($row = $productsRes->fetch_assoc()) {
        $products[] = $row;
    }

    if (count($products) === 0) {
        echo "Không có sản phẩm nào trong bảng products.\n";
        exit(0);
    }

    $targetPerProduct = 12;

    $countStmt = $conn->prepare("SELECT COUNT(*) AS total FROM product_reviews WHERE product_id = ?");
    $insertStmt = $conn->prepare("INSERT INTO product_reviews (product_id, user_id, reviewer_name, rating, comment) VALUES (?, NULL, ?, ?, ?)");

    $inserted = 0;

    foreach ($products as $product) {
        $productId = (int)$product['id'];
        $productName = trim((string)$product['name']);

        $countStmt->bind_param('i', $productId);
        $countStmt->execute();
        $countRes = $countStmt->get_result()->fetch_assoc();
        $currentCount = (int)($countRes['total'] ?? 0);

        if ($currentCount >= $targetPerProduct) {
            echo "[SKIP] {$productName} (ID {$productId}) đã có {$currentCount} đánh giá.\n";
            continue;
        }

        $need = $targetPerProduct - $currentCount;

        for ($i = 0; $i < $need; $i++) {
            $name = pick_random($names);
            $comment = pick_random($comments) . " Dịch vụ: {$productName}.";
            $rating = 5;

            $insertStmt->bind_param('isis', $productId, $name, $rating, $comment);
            $insertStmt->execute();
            $inserted++;
        }

        echo "[OK] {$productName} (ID {$productId}) +{$need} đánh giá 5 sao.\n";
    }

    echo "\nHoàn tất: đã thêm {$inserted} đánh giá mới.\n";
} catch (Throwable $e) {
    fwrite(STDERR, 'Lỗi: ' . $e->getMessage() . PHP_EOL);
    exit(1);
}
