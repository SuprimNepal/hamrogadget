<?php
/**
 * HamroGadget Database Connection & Auto-Setup
 * Compatible with XAMPP MySQL / MariaDB (PHP 7.4+ / 8.0+)
 */

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'hamrogadget_db');
define('JWT_SECRET', 'HG_XAMPP_MYSQL_SECRET_2026');

function getDBConnection() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        // If database does not exist, auto-create it using database.sql
        if ($e->getCode() == 1049 || strpos($e->getMessage(), 'Unknown database') !== false) {
            autoInitializeDatabase();
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } else {
            http_response_code(500);
            echo json_encode([
                'error' => 'Database connection failed: ' . $e->getMessage(),
                'hint'  => 'Ensure MySQL is running in XAMPP Control Panel. Default credentials: user "root", password "" (empty).'
            ]);
            exit;
        }
    }

    return $pdo;
}

/**
 * Auto initializes database and tables from database.sql if needed
 */
function autoInitializeDatabase() {
    try {
        $rootPdo = new PDO("mysql:host=" . DB_HOST . ";charset=utf8mb4", DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
        
        $sqlFile = __DIR__ . '/../database/database.sql';
        if (file_exists($sqlFile)) {
            $sql = file_get_contents($sqlFile);
            $rootPdo->exec($sql);
        }
    } catch (Exception $ex) {
        // Log or rethrow
    }
}

/**
 * Helper to generate UUID v4
 */
function generateUUID() {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

/**
 * Simple secure JWT generator for PHP (no external composer package required)
 */
function createJWT($payload, $secret = JWT_SECRET, $expirySeconds = 86400) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload['exp'] = time() + $expirySeconds;
    $payload['iat'] = time();
    $payloadJson = json_encode($payload);

    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payloadJson));

    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

/**
 * Simple secure JWT verifier for PHP
 */
function verifyJWT($token, $secret = JWT_SECRET) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;

    list($base64UrlHeader, $base64UrlPayload, $base64UrlSignature) = $parts;

    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
    $expectedSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

    if (!hash_equals($expectedSignature, $base64UrlSignature)) {
        return false;
    }

    $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $base64UrlPayload)), true);
    if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
        return false;
    }

    return $payload;
}

/**
 * Extract Bearer token from Authorization header
 */
function getBearerToken() {
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER['Authorization']);
    } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
    } else if (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }

    if (!empty($headers) && preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
        return $matches[1];
    }
    return null;
}

/**
 * Middleware: Verify Admin Access
 */
function requireAdminAuth() {
    $token = getBearerToken();
    if (!$token) {
        http_response_code(401);
        echo json_encode(['error' => 'Authorization token required']);
        exit;
    }

    $decoded = verifyJWT($token);
    if (!$decoded || !isset($decoded['role']) || $decoded['role'] !== 'admin') {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid or expired administrator token']);
        exit;
    }

    return $decoded;
}
