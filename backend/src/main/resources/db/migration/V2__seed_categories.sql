SET search_path TO kick_live, public;

INSERT INTO categories (id, name, slug, description, viewer_count, channel_count, is_active, created_at)
VALUES
  (gen_random_uuid(), 'Just Chatting', 'just-chatting', 'IRL & chatting', 0, 0, true, NOW()),
  (gen_random_uuid(), 'Games', 'games', 'Video games', 0, 0, true, NOW()),
  (gen_random_uuid(), 'Music', 'music', 'Music & DJ', 0, 0, true, NOW()),
  (gen_random_uuid(), 'Creative', 'creative', 'Art & making', 0, 0, true, NOW())
ON CONFLICT (slug) DO NOTHING;
