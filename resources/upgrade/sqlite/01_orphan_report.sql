-- Orphan checks (SQLite). Expect 0 after a successful upgrade.

SELECT COUNT(*) AS canvas_users_missing_host
FROM canvas_users cu
LEFT JOIN users u ON u.id = cu.user_id
WHERE u.id IS NULL;

SELECT COUNT(*) AS orphaned_posts
FROM canvas_posts p
LEFT JOIN users u ON u.id = p.user_id
WHERE p.user_id IS NOT NULL AND u.id IS NULL;

SELECT COUNT(*) AS orphaned_tags
FROM canvas_tags t
LEFT JOIN users u ON u.id = t.user_id
WHERE t.user_id IS NOT NULL AND u.id IS NULL;

SELECT COUNT(*) AS orphaned_topics
FROM canvas_topics t
LEFT JOIN users u ON u.id = t.user_id
WHERE t.user_id IS NOT NULL AND u.id IS NULL;

SELECT COUNT(*) AS orphaned_media
FROM canvas_media m
LEFT JOIN users u ON u.id = m.user_id
WHERE m.user_id IS NOT NULL AND u.id IS NULL;

SELECT COUNT(*) AS digest_missing_timezone
FROM canvas_users
WHERE digest = 1 AND (timezone IS NULL OR timezone = '');
