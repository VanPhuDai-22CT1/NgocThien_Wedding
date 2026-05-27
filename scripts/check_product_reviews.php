<?php

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$conn = new mysqli('localhost', 'root', '', 'uxi');
$conn->set_charset('utf8mb4');

$summaryRes = $conn->query("SELECT COUNT(*) AS total_reviews, COUNT(DISTINCT product_id) AS service_count FROM product_reviews");
$summary = $summaryRes->fetch_assoc();

echo 'total_reviews=' . (int)$summary['total_reviews'] . PHP_EOL;
echo 'service_count=' . (int)$summary['service_count'] . PHP_EOL;

$topRes = $conn->query("\n    SELECT p.name, COUNT(pr.id) AS review_count, ROUND(AVG(pr.rating), 1) AS avg_rating\n    FROM product_reviews pr\n    JOIN products p ON p.id = pr.product_id\n    GROUP BY pr.product_id\n    ORDER BY review_count DESC\n    LIMIT 5\n");

while ($row = $topRes->fetch_assoc()) {
    echo '- ' . $row['name'] . ' | reviews=' . (int)$row['review_count'] . ' | avg=' . $row['avg_rating'] . PHP_EOL;
}
