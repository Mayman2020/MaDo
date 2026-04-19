-- Demo streamers + live rows so Home / Browse / categories show real DB data (dev only).
-- Login: any seeded streamer or demoviewer — password: MadoDemo!24
SET search_path TO kick_live, public;

-- Category cards: cover images + rough live viewer totals (marketing-style).
UPDATE categories SET
  thumbnail_url = CASE slug
    WHEN 'just-chatting' THEN 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=480&h=720&fit=crop&q=80'
    WHEN 'games' THEN 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=480&h=720&fit=crop&q=80'
    WHEN 'music' THEN 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=480&h=720&fit=crop&q=80'
    WHEN 'creative' THEN 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=480&h=720&fit=crop&q=80'
    ELSE thumbnail_url
  END,
  viewer_count = CASE slug
    WHEN 'just-chatting' THEN 52000
    WHEN 'games' THEN 31000
    WHEN 'music' THEN 8400
    WHEN 'creative' THEN 6200
    ELSE COALESCE(viewer_count, 0)
  END,
  channel_count = CASE slug
    WHEN 'just-chatting' THEN 2
    WHEN 'games' THEN 2
    WHEN 'music' THEN 1
    WHEN 'creative' THEN 1
    ELSE COALESCE(channel_count, 0)
  END
WHERE slug IN ('just-chatting', 'games', 'music', 'creative');

-- Fixed UUIDs so this script stays readable; Flyway runs once per environment.
INSERT INTO users (id, username, email, password_hash, display_name, role, is_active, is_verified, follower_count)
VALUES
  ('a0000001-0000-4000-8000-000000000001'::uuid, 'mo_irlgta', 'mo_irlgta@mado.demo', crypt('MadoDemo!24', gen_salt('bf', 10)), 'Mo — IRL', 'STREAMER', true, true, 4200),
  ('a0000001-0000-4000-8000-000000000002'::uuid, 'pixelarena', 'pixelarena@mado.demo', crypt('MadoDemo!24', gen_salt('bf', 10)), 'PixelArena', 'STREAMER', true, true, 9100),
  ('a0000001-0000-4000-8000-000000000003'::uuid, 'beatlabdj', 'beatlabdj@mado.demo', crypt('MadoDemo!24', gen_salt('bf', 10)), 'Beat Lab', 'STREAMER', true, true, 2800),
  ('a0000001-0000-4000-8000-000000000004'::uuid, 'artforge', 'artforge@mado.demo', crypt('MadoDemo!24', gen_salt('bf', 10)), 'ArtForge', 'STREAMER', true, true, 1500),
  ('a0000001-0000-4000-8000-000000000005'::uuid, 'slotfan_mado', 'slotfan@mado.demo', crypt('MadoDemo!24', gen_salt('bf', 10)), 'SlotFan', 'STREAMER', true, true, 12000),
  ('a0000001-0000-4000-8000-000000000006'::uuid, 'headshot_mado', 'headshot@mado.demo', crypt('MadoDemo!24', gen_salt('bf', 10)), 'Headshot', 'STREAMER', true, true, 6700),
  ('a0000001-0000-4000-8000-000000000007'::uuid, 'demoviewer', 'viewer@mado.demo', crypt('MadoDemo!24', gen_salt('bf', 10)), 'Demo Viewer', 'VIEWER', true, true, 0)
ON CONFLICT (username) DO NOTHING;

INSERT INTO channels (id, user_id, title, description, stream_key, is_live, viewer_count, peak_viewer_count, follower_count, thumbnail_url, category_id, language)
SELECT 'b0000001-0000-4000-8000-000000000001'::uuid, u.id,
  'IRL — evening walk & chat',
  'Seeded demo stream for MaDo Live.',
  'mado-sk-mo-irl',
  true, 15230, 22000, 8900,
  'https://picsum.photos/seed/madoirl/1280/720',
  c.id, 'en'
FROM users u CROSS JOIN categories c
WHERE u.username = 'mo_irlgta' AND c.slug = 'just-chatting'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO channels (id, user_id, title, description, stream_key, is_live, viewer_count, peak_viewer_count, follower_count, thumbnail_url, category_id, language)
SELECT 'b0000001-0000-4000-8000-000000000002'::uuid, u.id,
  'Ranked — tonight we climb',
  'Demo games stream.',
  'mado-sk-pixel',
  true, 8340, 15000, 12000,
  'https://picsum.photos/seed/madogames/1280/720',
  c.id, 'en'
FROM users u CROSS JOIN categories c
WHERE u.username = 'pixelarena' AND c.slug = 'games'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO channels (id, user_id, title, description, stream_key, is_live, viewer_count, peak_viewer_count, follower_count, thumbnail_url, category_id, language)
SELECT 'b0000001-0000-4000-8000-000000000003'::uuid, u.id,
  'House / techno DJ set',
  'Demo music stream.',
  'mado-sk-beat',
  true, 2100, 4500, 3400,
  'https://picsum.photos/seed/madomusic/1280/720',
  c.id, 'en'
FROM users u CROSS JOIN categories c
WHERE u.username = 'beatlabdj' AND c.slug = 'music'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO channels (id, user_id, title, description, stream_key, is_live, viewer_count, peak_viewer_count, follower_count, thumbnail_url, category_id, language)
SELECT 'b0000001-0000-4000-8000-000000000004'::uuid, u.id,
  'Digital painting — commissions open',
  'Demo creative stream.',
  'mado-sk-art',
  true, 940, 2100, 1100,
  'https://picsum.photos/seed/madoart/1280/720',
  c.id, 'en'
FROM users u CROSS JOIN categories c
WHERE u.username = 'artforge' AND c.slug = 'creative'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO channels (id, user_id, title, description, stream_key, is_live, viewer_count, peak_viewer_count, follower_count, thumbnail_url, category_id, language)
SELECT 'b0000001-0000-4000-8000-000000000005'::uuid, u.id,
  'Slots & chill — big wins today',
  'Demo high-traffic listing.',
  'mado-sk-slots',
  true, 42100, 90000, 45000,
  'https://picsum.photos/seed/madoslots/1280/720',
  c.id, 'en'
FROM users u CROSS JOIN categories c
WHERE u.username = 'slotfan_mado' AND c.slug = 'just-chatting'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO channels (id, user_id, title, description, stream_key, is_live, viewer_count, peak_viewer_count, follower_count, thumbnail_url, category_id, language)
SELECT 'b0000001-0000-4000-8000-000000000006'::uuid, u.id,
  'CS2 — matchmaking with chat',
  'Demo FPS stream.',
  'mado-sk-cs2',
  true, 5600, 11000, 7800,
  'https://picsum.photos/seed/madocs2/1280/720',
  c.id, 'en'
FROM users u CROSS JOIN categories c
WHERE u.username = 'headshot_mado' AND c.slug = 'games'
ON CONFLICT (user_id) DO NOTHING;

-- Active broadcast rows (ended_at NULL) so API exposes streamId + live tiles.
INSERT INTO streams (id, channel_id, title, category_id, language, tags, is_mature, thumbnail_url, peak_viewers, started_at, ended_at)
SELECT 'c0000001-0000-4000-8000-000000000001'::uuid, ch.id, ch.title, ch.category_id, 'en', ARRAY['english', 'demo'], false, ch.thumbnail_url, ch.viewer_count, NOW() - INTERVAL '95 minutes', NULL
FROM channels ch WHERE ch.id = 'b0000001-0000-4000-8000-000000000001'::uuid
ON CONFLICT (id) DO NOTHING;

INSERT INTO streams (id, channel_id, title, category_id, language, tags, is_mature, thumbnail_url, peak_viewers, started_at, ended_at)
SELECT 'c0000001-0000-4000-8000-000000000002'::uuid, ch.id, ch.title, ch.category_id, 'en', ARRAY['competitive', 'demo'], false, ch.thumbnail_url, ch.viewer_count, NOW() - INTERVAL '40 minutes', NULL
FROM channels ch WHERE ch.id = 'b0000001-0000-4000-8000-000000000002'::uuid
ON CONFLICT (id) DO NOTHING;

INSERT INTO streams (id, channel_id, title, category_id, language, tags, is_mature, thumbnail_url, peak_viewers, started_at, ended_at)
SELECT 'c0000001-0000-4000-8000-000000000003'::uuid, ch.id, ch.title, ch.category_id, 'en', ARRAY['music', 'demo'], false, ch.thumbnail_url, ch.viewer_count, NOW() - INTERVAL '120 minutes', NULL
FROM channels ch WHERE ch.id = 'b0000001-0000-4000-8000-000000000003'::uuid
ON CONFLICT (id) DO NOTHING;

INSERT INTO streams (id, channel_id, title, category_id, language, tags, is_mature, thumbnail_url, peak_viewers, started_at, ended_at)
SELECT 'c0000001-0000-4000-8000-000000000004'::uuid, ch.id, ch.title, ch.category_id, 'en', ARRAY['art', 'demo'], false, ch.thumbnail_url, ch.viewer_count, NOW() - INTERVAL '55 minutes', NULL
FROM channels ch WHERE ch.id = 'b0000001-0000-4000-8000-000000000004'::uuid
ON CONFLICT (id) DO NOTHING;

INSERT INTO streams (id, channel_id, title, category_id, language, tags, is_mature, thumbnail_url, peak_viewers, started_at, ended_at)
SELECT 'c0000001-0000-4000-8000-000000000005'::uuid, ch.id, ch.title, ch.category_id, 'en', ARRAY['slots', '18', 'demo'], true, ch.thumbnail_url, ch.viewer_count, NOW() - INTERVAL '200 minutes', NULL
FROM channels ch WHERE ch.id = 'b0000001-0000-4000-8000-000000000005'::uuid
ON CONFLICT (id) DO NOTHING;

INSERT INTO streams (id, channel_id, title, category_id, language, tags, is_mature, thumbnail_url, peak_viewers, started_at, ended_at)
SELECT 'c0000001-0000-4000-8000-000000000006'::uuid, ch.id, ch.title, ch.category_id, 'en', ARRAY['cs2', 'fps', 'demo'], false, ch.thumbnail_url, ch.viewer_count, NOW() - INTERVAL '30 minutes', NULL
FROM channels ch WHERE ch.id = 'b0000001-0000-4000-8000-000000000006'::uuid
ON CONFLICT (id) DO NOTHING;

-- Sample clips (public MP4) for the Clips page.
INSERT INTO clips (id, stream_id, channel_id, creator_id, title, clip_url, thumbnail_url, duration_seconds, view_count, is_featured)
SELECT 'd0000001-0000-4000-8000-000000000001'::uuid, s.id, ch.id, u.id,
  'Demo clip — Big Buck Bunny (sample)',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://picsum.photos/seed/clipdemo/640/360',
  60, 1200, true
FROM streams s
JOIN channels ch ON ch.id = s.channel_id
JOIN users u ON u.id = ch.user_id
WHERE s.id = 'c0000001-0000-4000-8000-000000000002'::uuid
LIMIT 1
ON CONFLICT (id) DO NOTHING;

INSERT INTO clips (id, stream_id, channel_id, creator_id, title, clip_url, thumbnail_url, duration_seconds, view_count, is_featured)
SELECT 'd0000001-0000-4000-8000-000000000002'::uuid, s.id, ch.id, u.id,
  'Demo clip — Elephants Dream (sample)',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://picsum.photos/seed/clipdemo2/640/360',
  45, 430, false
FROM streams s
JOIN channels ch ON ch.id = s.channel_id
JOIN users u ON u.id = ch.user_id
WHERE s.id = 'c0000001-0000-4000-8000-000000000006'::uuid
LIMIT 1
ON CONFLICT (id) DO NOTHING;
