-- Copy one topic per post from canvas_posts_topics into canvas_posts.topic_id (MySQL).
-- Review multi-topic posts before dropping the pivot. See UPGRADE.md.

-- 1) Add column if missing (skip if already present)
-- ALTER TABLE canvas_posts ADD COLUMN topic_id CHAR(36) NULL;
-- CREATE INDEX canvas_posts_topic_id_index ON canvas_posts (topic_id);

-- 2) Prefer the lowest topic_id per post when multiple rows exist
UPDATE canvas_posts p
INNER JOIN (
    SELECT post_id, MIN(topic_id) AS topic_id
    FROM canvas_posts_topics
    GROUP BY post_id
) ppt ON ppt.post_id = p.id
SET p.topic_id = ppt.topic_id
WHERE p.topic_id IS NULL;

-- 3) Verify (expect 0)
SELECT COUNT(*) AS posts_still_missing_topic_id
FROM canvas_posts p
INNER JOIN canvas_posts_topics ppt ON ppt.post_id = p.id
WHERE p.topic_id IS NULL;

-- 4) When satisfied:
-- DROP TABLE canvas_posts_topics;
