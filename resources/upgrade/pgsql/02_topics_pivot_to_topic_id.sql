-- Copy one topic per post from canvas_posts_topics into canvas_posts.topic_id (PostgreSQL).

-- ALTER TABLE canvas_posts ADD COLUMN IF NOT EXISTS topic_id CHAR(36) NULL;
-- CREATE INDEX IF NOT EXISTS canvas_posts_topic_id_index ON canvas_posts (topic_id);

UPDATE canvas_posts p
SET topic_id = ppt.topic_id
FROM (
    SELECT DISTINCT ON (post_id) post_id, topic_id
    FROM canvas_posts_topics
    ORDER BY post_id, topic_id
) ppt
WHERE ppt.post_id = p.id
  AND p.topic_id IS NULL;

SELECT COUNT(*) AS posts_still_missing_topic_id
FROM canvas_posts p
INNER JOIN canvas_posts_topics ppt ON ppt.post_id = p.id
WHERE p.topic_id IS NULL;

-- DROP TABLE canvas_posts_topics;
