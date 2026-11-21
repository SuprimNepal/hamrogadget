<?php
/**
 * HamroGadget Database Setup & Migration Runner
 * Accessible via Browser (http://localhost/hamrogadget/database/setup_db.php) or CLI (php setup_db.php)
 */

$host = 'localhost';
$user = 'root';
$pass = '';
$dbname = 'hamrogadget_db';

$messages = [];
$success = false;

try {
    // 1. Connect without db to ensure MySQL is running
    $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    $messages[] = "✓ Successfully connected to MySQL at <strong>$host</strong>.";

    // 2. Read database.sql
    $sqlFile = __DIR__ . '/database.sql';
    if (!file_exists($sqlFile)) {
        throw new Exception("database.sql file not found at " . $sqlFile);
    }
    $sql = file_get_contents($sqlFile);
    $messages[] = "✓ Read database.sql schema and seed file (" . round(strlen($sql) / 1024, 1) . " KB).";

    // 3. Execute queries
    $pdo->exec($sql);
    $messages[] = "✓ Executed database creation and seed statements successfully.";

    // 4. Verify counts
    $pdo->exec("USE `$dbname`");

    $adminCount = $pdo->query("SELECT COUNT(*) FROM `admins`")->fetchColumn();
    $userCount = $pdo->query("SELECT COUNT(*) FROM `users`")->fetchColumn();
    $productCount = $pdo->query("SELECT COUNT(*) FROM `products`")->fetchColumn();
    $mediaCount = $pdo->query("SELECT COUNT(*) FROM `scraped_media`")->fetchColumn();

    $messages[] = "✓ Verified <strong>$adminCount</strong> Admin record.";
    $messages[] = "✓ Verified <strong>$userCount</strong> User records.";
    $messages[] = "✓ Verified <strong>$productCount</strong> Products in catalog.";
    $messages[] = "✓ Verified <strong>$mediaCount</strong> Scraped media images.";

    $success = true;
} catch (Exception $e) {
    $messages[] = "✗ Error: " . $e->getMessage();
}

// If CLI
if (php_sapi_name() === 'cli') {
    foreach ($messages as $msg) {
        echo strip_tags($msg) . PHP_EOL;
    }
    exit($success ? 0 : 1);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HamroGadget — Database Setup</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px 20px; display: flex; justify-content: center; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; max-width: 640px; width: 100%; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    h1 { font-size: 24px; margin-bottom: 8px; color: #38bdf8; }
    p { color: #94a3b8; font-size: 14px; margin-bottom: 24px; }
    .log-list { background: #090d16; border-radius: 8px; padding: 16px; list-style: none; margin: 0 0 24px 0; font-family: monospace; font-size: 13px; }
    .log-list li { margin-bottom: 8px; line-height: 1.4; color: #cbd5e1; }
    .log-list li.err { color: #f87171; }
    .btn { display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; transition: background 0.2s; }
    .btn:hover { background: #1d4ed8; }
    .creds { background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 6px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; }
    .creds strong { color: #38bdf8; }
  </style>
</head>
<body>
  <div class="card">
    <h1>HamroGadget Database Setup</h1>
    <p>MySQL / MariaDB initialization for XAMPP Localhost</p>

    <ul class="log-list">
      <?php foreach ($messages as $msg): ?>
        <li class="<?php echo strpos($msg, '✗') !== false ? 'err' : ''; ?>"><?php echo $msg; ?></li>
      <?php endforeach; ?>
    </ul>

    <?php if ($success): ?>
      <div class="creds">
        <strong>Seeded Credentials:</strong><br>
        • <strong>Admin:</strong> admin12@gmail.com / admin12@ (Redirects to Admin Dashboard)<br>
        • <strong>Demo Member:</strong> member@gmail.com / member12@
      </div>
      <a href="../" class="btn">Open HamroGadget Storefront &rarr;</a>
    <?php else: ?>
      <p style="color: #f87171;">Setup failed. Ensure MySQL service is running in your XAMPP Control Panel and try again.</p>
    <?php endif; ?>
  </div>
</body>
</html>
