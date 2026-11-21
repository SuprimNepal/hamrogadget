<?php
/**
 * HamroGadget Central REST API Controller
 * Supports Apache URL rewriting & Direct parameter routing for XAMPP
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/db.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Parse input body
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true) ?: [];

// Parse route
$route = '';
if (isset($_GET['route'])) {
    $route = trim($_GET['route'], '/');
} else {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    // Find the position of '/api/'
    $pos = strpos($uri, '/api/');
    if ($pos !== false) {
        $route = substr($uri, $pos + 5);
    } else if (preg_match('#/api$#', $uri)) {
        $route = '';
    } else {
        $route = trim($uri, '/');
    }
}
$route = trim($route, '/');
$segments = $route !== '' ? explode('/', $route) : [];

// ============================================================
// ROUTING
// ============================================================

// --- 1. /api/auth/login ---
if ($route === 'auth/login' && $method === 'POST') {
    $email = trim($input['email'] ?? '');
    $password = trim($input['password'] ?? '');

    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['error' => 'Email and password are required']);
        exit;
    }

    $normalizedEmail = strtolower($email);

    // 1. Check Admin
    $stmt = $pdo->prepare("SELECT * FROM `admins` WHERE LOWER(email) = ? LIMIT 1");
    $stmt->execute([$normalizedEmail]);
    $admin = $stmt->fetch();

    if ($admin) {
        if (!password_verify($password, $admin['password'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid admin credentials']);
            exit;
        }

        $tokenPayload = [
            'id'    => $admin['id'],
            'email' => $admin['email'],
            'name'  => $admin['name'],
            'role'  => 'admin'
        ];
        $token = createJWT($tokenPayload);

        echo json_encode([
            'token'      => $token,
            'role'       => 'admin',
            'redirectTo' => '#/admin',
            'user'       => $tokenPayload,
            'message'    => 'Welcome back, Administrator!'
        ]);
        exit;
    }

    // 2. Check Regular User
    $stmt = $pdo->prepare("SELECT * FROM `users` WHERE LOWER(email) = ? LIMIT 1");
    $stmt->execute([$normalizedEmail]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(401);
        echo json_encode([
            'error' => 'No account found with this email. Please Sign Up first to create your account!'
        ]);
        exit;
    }

    if (!password_verify($password, $user['password'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Incorrect password. Please try again.']);
        exit;
    }

    $tokenPayload = [
        'id'    => $user['id'],
        'email' => $user['email'],
        'name'  => $user['name'],
        'role'  => 'user'
    ];
    $token = createJWT($tokenPayload);

    echo json_encode([
        'token'      => $token,
        'role'       => 'user',
        'redirectTo' => '#/',
        'user'       => $tokenPayload,
        'message'    => 'Welcome back, ' . $user['name'] . '!'
    ]);
    exit;
}

// --- 2. /api/auth/signup ---
if ($route === 'auth/signup' && $method === 'POST') {
    $name = trim($input['name'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';

    if (empty($name) || empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['error' => 'Name, email, and password are required']);
        exit;
    }
    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must be at least 6 characters long']);
        exit;
    }

    $normalizedEmail = strtolower($email);

    // Check if reserved by admin
    $stmt = $pdo->prepare("SELECT id FROM `admins` WHERE LOWER(email) = ? LIMIT 1");
    $stmt->execute([$normalizedEmail]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'This email is reserved for administration']);
        exit;
    }

    // Check existing user
    $stmt = $pdo->prepare("SELECT id FROM `users` WHERE LOWER(email) = ? LIMIT 1");
    $stmt->execute([$normalizedEmail]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'An account with this email already exists. Please log in.']);
        exit;
    }

    $userId = generateUUID();
    $hash = password_hash($password, PASSWORD_BCRYPT);

    $stmt = $pdo->prepare("INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`) VALUES (?, ?, ?, ?, 'user', NOW())");
    $stmt->execute([$userId, $name, $normalizedEmail, $hash]);

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Account created successfully! You can now log in with your credentials.',
        'user'    => [
            'id'    => $userId,
            'name'  => $name,
            'email' => $normalizedEmail
        ]
    ]);
    exit;
}

// --- 3. /api/auth/me ---
if ($route === 'auth/me' && $method === 'GET') {
    $token = getBearerToken();
    if (!$token) {
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }
    $decoded = verifyJWT($token);
    if (!$decoded) {
        http_response_code(401);
        echo json_encode(['error' => 'Session expired or invalid']);
        exit;
    }
    echo json_encode(['user' => $decoded]);
    exit;
}

// --- 4. /api/categories ---
if ($route === 'categories' && $method === 'GET') {
    echo json_encode(['Laptops', 'Phones', 'Headphones', 'Smartwatches', 'Accessories', 'Other Tech']);
    exit;
}

// --- 5. /api/media/scraped ---
if ($route === 'media/scraped' && $method === 'GET') {
    $stmt = $pdo->query("SELECT `image_url` FROM `scraped_media` ORDER BY `id` ASC");
    $images = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo json_encode($images ?: []);
    exit;
}

// --- 6. /api/products/:id/stock (PATCH) ---
if (count($segments) === 3 && $segments[0] === 'products' && $segments[2] === 'stock' && $method === 'PATCH') {
    requireAdminAuth();
    $id = $segments[1];
    $stmt = $pdo->prepare("SELECT * FROM `products` WHERE `id` = ? LIMIT 1");
    $stmt->execute([$id]);
    $product = $stmt->fetch();
    if (!$product) {
        http_response_code(404);
        echo json_encode(['error' => 'Product not found']);
        exit;
    }

    $states = ['In Stock', 'Pre-Order', 'Out of Stock'];
    $currentIdx = array_search($product['availability'], $states);
    $nextIdx = ($currentIdx !== false) ? (($currentIdx + 1) % count($states)) : 0;
    $newStock = $states[$nextIdx];

    $update = $pdo->prepare("UPDATE `products` SET `availability` = ?, `updated_at` = NOW() WHERE `id` = ?");
    $update->execute([$newStock, $id]);

    $product['availability'] = $newStock;
    $product['images'] = json_decode($product['images'] ?: '[]', true);
    $product['specs'] = json_decode($product['specs'] ?: '{}', true);
    $product['features'] = json_decode($product['features'] ?: '[]', true);
    $product['tags'] = json_decode($product['tags'] ?: '[]', true);
    $product['price'] = (float)$product['price'];
    $product['featured'] = (bool)$product['featured'];

    echo json_encode($product);
    exit;
}

// --- 7. /api/products/:id/featured (PATCH) ---
if (count($segments) === 3 && $segments[0] === 'products' && $segments[2] === 'featured' && $method === 'PATCH') {
    requireAdminAuth();
    $id = $segments[1];
    $stmt = $pdo->prepare("SELECT * FROM `products` WHERE `id` = ? LIMIT 1");
    $stmt->execute([$id]);
    $product = $stmt->fetch();
    if (!$product) {
        http_response_code(404);
        echo json_encode(['error' => 'Product not found']);
        exit;
    }

    $newFeatured = $product['featured'] ? 0 : 1;
    $update = $pdo->prepare("UPDATE `products` SET `featured` = ?, `updated_at` = NOW() WHERE `id` = ?");
    $update->execute([$newFeatured, $id]);

    $product['featured'] = (bool)$newFeatured;
    $product['images'] = json_decode($product['images'] ?: '[]', true);
    $product['specs'] = json_decode($product['specs'] ?: '{}', true);
    $product['features'] = json_decode($product['features'] ?: '[]', true);
    $product['tags'] = json_decode($product['tags'] ?: '[]', true);
    $product['price'] = (float)$product['price'];

    echo json_encode($product);
    exit;
}

// --- 8. /api/products/:id (GET, PUT, DELETE) ---
if (count($segments) === 2 && $segments[0] === 'products') {
    $id = $segments[1];

    if ($method === 'GET') {
        $stmt = $pdo->prepare("SELECT * FROM `products` WHERE `id` = ? LIMIT 1");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) {
            http_response_code(404);
            echo json_encode(['error' => 'Product not found']);
            exit;
        }

        $row['price'] = (float)$row['price'];
        $row['discountPrice'] = $row['discount_price'] !== null ? (float)$row['discount_price'] : null;
        $row['shortDescription'] = $row['short_description'];
        $row['images'] = json_decode($row['images'] ?: '[]', true);
        $row['specs'] = json_decode($row['specs'] ?: '{}', true);
        $row['features'] = json_decode($row['features'] ?: '[]', true);
        $row['tags'] = json_decode($row['tags'] ?: '[]', true);
        $row['featured'] = (bool)$row['featured'];
        $row['createdAt'] = $row['created_at'];
        $row['updatedAt'] = $row['updated_at'];

        echo json_encode($row);
        exit;
    }

    if ($method === 'PUT') {
        requireAdminAuth();
        $stmt = $pdo->prepare("SELECT * FROM `products` WHERE `id` = ? LIMIT 1");
        $stmt->execute([$id]);
        $existing = $stmt->fetch();
        if (!$existing) {
            http_response_code(404);
            echo json_encode(['error' => 'Product not found']);
            exit;
        }

        $name = $input['name'] ?? $existing['name'];
        $brand = $input['brand'] ?? $existing['brand'];
        $category = $input['category'] ?? $existing['category'];
        $price = isset($input['price']) ? (float)$input['price'] : (float)$existing['price'];
        $discountPrice = isset($input['discountPrice']) ? (float)$input['discountPrice'] : ($existing['discount_price'] !== null ? (float)$existing['discount_price'] : null);
        $images = isset($input['images']) ? json_encode($input['images']) : $existing['images'];
        $shortDesc = $input['shortDescription'] ?? $existing['short_description'];
        $specs = isset($input['specs']) ? json_encode($input['specs']) : $existing['specs'];
        $features = isset($input['features']) ? json_encode($input['features']) : $existing['features'];
        $availability = $input['availability'] ?? $existing['availability'];
        $warranty = $input['warranty'] ?? $existing['warranty'];
        $tags = isset($input['tags']) ? json_encode($input['tags']) : $existing['tags'];
        $featured = isset($input['featured']) ? ($input['featured'] ? 1 : 0) : $existing['featured'];

        $upd = $pdo->prepare("UPDATE `products` SET 
            `name` = ?, `brand` = ?, `category` = ?, `price` = ?, `discount_price` = ?,
            `images` = ?, `short_description` = ?, `specs` = ?, `features` = ?,
            `availability` = ?, `warranty` = ?, `tags` = ?, `featured` = ?, `updated_at` = NOW()
            WHERE `id` = ?");
        $upd->execute([
            $name, $brand, $category, $price, $discountPrice,
            $images, $shortDesc, $specs, $features,
            $availability, $warranty, $tags, $featured, $id
        ]);

        $res = [
            'id'               => $id,
            'name'             => $name,
            'brand'            => $brand,
            'category'         => $category,
            'price'            => $price,
            'discountPrice'    => $discountPrice,
            'images'           => json_decode($images, true),
            'shortDescription' => $shortDesc,
            'specs'            => json_decode($specs, true),
            'features'         => json_decode($features, true),
            'availability'     => $availability,
            'warranty'         => $warranty,
            'tags'             => json_decode($tags, true),
            'featured'         => (bool)$featured,
            'updatedAt'        => date('c')
        ];
        echo json_encode($res);
        exit;
    }

    if ($method === 'DELETE') {
        requireAdminAuth();
        $stmt = $pdo->prepare("SELECT * FROM `products` WHERE `id` = ? LIMIT 1");
        $stmt->execute([$id]);
        $product = $stmt->fetch();
        if (!$product) {
            http_response_code(404);
            echo json_encode(['error' => 'Product not found']);
            exit;
        }

        $del = $pdo->prepare("DELETE FROM `products` WHERE `id` = ?");
        $del->execute([$id]);

        echo json_encode(['message' => 'Product deleted', 'id' => $id]);
        exit;
    }
}

// --- 9. /api/products (GET list & POST create) ---
if ($route === 'products' || (count($segments) === 1 && $segments[0] === 'products')) {
    if ($method === 'GET') {
        $sql = "SELECT * FROM `products` WHERE 1=1";
        $params = [];

        if (!empty($_GET['category']) && strtolower($_GET['category']) !== 'all') {
            $sql .= " AND LOWER(`category`) = LOWER(?)";
            $params[] = $_GET['category'];
        }
        if (!empty($_GET['brand'])) {
            $sql .= " AND LOWER(`brand`) = LOWER(?)";
            $params[] = $_GET['brand'];
        }
        if (!empty($_GET['search'])) {
            $q = '%' . $_GET['search'] . '%';
            $sql .= " AND (`name` LIKE ? OR `brand` LIKE ? OR `short_description` LIKE ? OR `tags` LIKE ?)";
            $params[] = $q;
            $params[] = $q;
            $params[] = $q;
            $params[] = $q;
        }
        if (isset($_GET['minPrice']) && is_numeric($_GET['minPrice'])) {
            $sql .= " AND `price` >= ?";
            $params[] = (float)$_GET['minPrice'];
        }
        if (isset($_GET['maxPrice']) && is_numeric($_GET['maxPrice'])) {
            $sql .= " AND `price` <= ?";
            $params[] = (float)$_GET['maxPrice'];
        }
        if (!empty($_GET['availability'])) {
            $sql .= " AND `availability` = ?";
            $params[] = $_GET['availability'];
        }
        if (isset($_GET['featured'])) {
            $isFeat = ($_GET['featured'] === 'true' || $_GET['featured'] === '1') ? 1 : 0;
            $sql .= " AND `featured` = ?";
            $params[] = $isFeat;
        }

        $sort = $_GET['sort'] ?? '';
        if ($sort === 'newest') {
            $sql .= " ORDER BY `created_at` DESC";
        } else if ($sort === 'price-asc') {
            $sql .= " ORDER BY `price` ASC";
        } else if ($sort === 'price-desc') {
            $sql .= " ORDER BY `price` DESC";
        } else {
            $sql .= " ORDER BY `created_at` DESC";
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $result = array_map(function($r) {
            return [
                'id'               => $r['id'],
                'name'             => $r['name'],
                'brand'            => $r['brand'],
                'category'         => $r['category'],
                'price'            => (float)$r['price'],
                'discountPrice'    => $r['discount_price'] !== null ? (float)$r['discount_price'] : null,
                'images'           => json_decode($r['images'] ?: '[]', true),
                'shortDescription' => $r['short_description'],
                'specs'            => json_decode($r['specs'] ?: '{}', true),
                'features'         => json_decode($r['features'] ?: '[]', true),
                'availability'     => $r['availability'],
                'warranty'         => $r['warranty'],
                'tags'             => json_decode($r['tags'] ?: '[]', true),
                'featured'         => (bool)$r['featured'],
                'createdAt'        => $r['created_at'],
                'updatedAt'        => $r['updated_at']
            ];
        }, $rows);

        echo json_encode($result);
        exit;
    }

    if ($method === 'POST') {
        requireAdminAuth();
        $name = trim($input['name'] ?? '');
        $brand = trim($input['brand'] ?? '');
        $category = trim($input['category'] ?? '');
        $price = isset($input['price']) ? (float)$input['price'] : null;

        if (empty($name) || empty($brand) || empty($category) || $price === null) {
            http_response_code(400);
            echo json_encode(['error' => 'name, brand, category, and price are required']);
            exit;
        }

        $newId = generateUUID();
        $discountPrice = isset($input['discountPrice']) && $input['discountPrice'] !== '' ? (float)$input['discountPrice'] : null;
        $images = json_encode($input['images'] ?? []);
        $shortDesc = $input['shortDescription'] ?? '';
        $specs = json_encode($input['specs'] ?? new stdClass());
        $features = json_encode($input['features'] ?? []);
        $availability = $input['availability'] ?? 'In Stock';
        $warranty = $input['warranty'] ?? '';
        $tags = json_encode($input['tags'] ?? []);
        $featured = !empty($input['featured']) ? 1 : 0;

        $stmt = $pdo->prepare("INSERT INTO `products` (
            `id`, `name`, `brand`, `category`, `price`, `discount_price`,
            `images`, `short_description`, `specs`, `features`,
            `availability`, `warranty`, `tags`, `featured`, `created_at`, `updated_at`
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");

        $stmt->execute([
            $newId, $name, $brand, $category, $price, $discountPrice,
            $images, $shortDesc, $specs, $features,
            $availability, $warranty, $tags, $featured
        ]);

        $created = [
            'id'               => $newId,
            'name'             => $name,
            'brand'            => $brand,
            'category'         => $category,
            'price'            => $price,
            'discountPrice'    => $discountPrice,
            'images'           => json_decode($images, true),
            'shortDescription' => $shortDesc,
            'specs'            => json_decode($specs, true),
            'features'         => json_decode($features, true),
            'availability'     => $availability,
            'warranty'         => $warranty,
            'tags'             => json_decode($tags, true),
            'featured'         => (bool)$featured,
            'createdAt'        => date('c'),
            'updatedAt'        => date('c')
        ];

        http_response_code(201);
        echo json_encode($created);
        exit;
    }
}

// --- 10. /api/upload (POST) ---
if ($route === 'upload' && $method === 'POST') {
    requireAdminAuth();
    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'No image file uploaded or upload error occurred']);
        exit;
    }

    $file = $_FILES['image'];
    $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

    if (!in_array($ext, $allowed)) {
        http_response_code(400);
        echo json_encode(['error' => 'Only image files (jpg, png, webp, svg, gif) are allowed']);
        exit;
    }

    $uploadDir = __DIR__ . '/../uploads/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $newFilename = generateUUID() . '.' . $ext;
    $targetPath = $uploadDir . $newFilename;

    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        echo json_encode(['url' => 'uploads/' . $newFilename]);
        exit;
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save uploaded image']);
        exit;
    }
}

// Fallback 404 for unknown route
http_response_code(404);
echo json_encode(['error' => 'Route not found: ' . $route]);
