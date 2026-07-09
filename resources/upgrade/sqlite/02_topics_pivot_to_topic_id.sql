-- Copy one topic per post (SQLite). Add topic_id first if needed.

-- ALTER TABLE canvas_posts ADD COLUMN topic_id TEXT NULL;

UPDATE canvas_posts
SET topic_id = (
    SELECT topic_id FROM canvas_posts_topics
    WHERE canvas_posts_topics.post_id = canvas_posts.id
    ORDER BY topic_id
    LIMIT 1
)
WHERE topic_id IS NULL
  AND EXISTS (
      SELECT 1 FROM canvas_posts_topics ppt WHERE ppt.post_id = canvas_posts.id
  );

SELECT COUNT(*) AS posts_still_missing_topic_id
FROM canvas_posts p
INNER JOIN canvas_posts_topics ppt ON ppt.post_id = p.id
WHERE p.topic_id IS NULL;

-- DROP TABLE canvas_posts_topics;
