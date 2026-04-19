CREATE SCHEMA IF NOT EXISTS kick_live;
SET search_path TO kick_live, public;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(30) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(50),
  avatar_url VARCHAR(500),
  banner_url VARCHAR(500),
  bio TEXT,
  role VARCHAR(20) DEFAULT 'VIEWER',
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  two_fa_enabled BOOLEAN DEFAULT FALSE,
  two_fa_secret VARCHAR(100),
  follower_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  thumbnail_url VARCHAR(500),
  viewer_count INTEGER DEFAULT 0,
  channel_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(140) DEFAULT 'Welcome to my channel!',
  description TEXT,
  stream_key VARCHAR(100) UNIQUE NOT NULL,
  is_live BOOLEAN DEFAULT FALSE,
  viewer_count INTEGER DEFAULT 0,
  peak_viewer_count INTEGER DEFAULT 0,
  total_views BIGINT DEFAULT 0,
  thumbnail_url VARCHAR(500),
  offline_banner_url VARCHAR(500),
  subscriber_count INTEGER DEFAULT 0,
  follower_count INTEGER DEFAULT 0,
  category_id UUID REFERENCES categories(id),
  language VARCHAR(10) DEFAULT 'en',
  tags TEXT[],
  is_mature BOOLEAN DEFAULT FALSE,
  is_subscription_enabled BOOLEAN DEFAULT FALSE,
  sub_price_tier1 DECIMAL(10,2) DEFAULT 4.99,
  sub_price_tier2 DECIMAL(10,2) DEFAULT 9.99,
  sub_price_tier3 DECIMAL(10,2) DEFAULT 24.99,
  channel_points_enabled BOOLEAN DEFAULT FALSE,
  slow_mode_seconds INTEGER DEFAULT 0,
  followers_only_mode BOOLEAN DEFAULT FALSE,
  subscribers_only_mode BOOLEAN DEFAULT FALSE,
  emotes_only_mode BOOLEAN DEFAULT FALSE,
  min_account_age_days INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  title VARCHAR(140),
  category_id UUID REFERENCES categories(id),
  language VARCHAR(10),
  tags TEXT[],
  is_mature BOOLEAN DEFAULT FALSE,
  vod_url VARCHAR(500),
  vod_enabled BOOLEAN DEFAULT TRUE,
  thumbnail_url VARCHAR(500),
  peak_viewers INTEGER DEFAULT 0,
  avg_viewers INTEGER DEFAULT 0,
  total_views BIGINT DEFAULT 0,
  chat_messages INTEGER DEFAULT 0,
  new_followers INTEGER DEFAULT 0,
  new_subs INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  stream_id UUID REFERENCES streams(id),
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'TEXT',
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_by UUID REFERENCES users(id),
  badges TEXT[],
  color VARCHAR(7),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  notification_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES users(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  tier VARCHAR(10) DEFAULT 'TIER1',
  price DECIMAL(10,2),
  stripe_sub_id VARCHAR(200),
  is_active BOOLEAN DEFAULT TRUE,
  is_gifted BOOLEAN DEFAULT FALSE,
  gifted_by UUID REFERENCES users(id),
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  renewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID REFERENCES streams(id) ON DELETE SET NULL,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(140) NOT NULL,
  clip_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  duration_seconds INTEGER DEFAULT 30,
  view_count BIGINT DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  start_offset INTEGER,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID UNIQUE REFERENCES streams(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  title VARCHAR(140),
  vod_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  duration_seconds INTEGER,
  view_count BIGINT DEFAULT 0,
  is_public BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE emotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  is_global BOOLEAN DEFAULT FALSE,
  is_subscriber_only BOOLEAN DEFAULT FALSE,
  tier_required VARCHAR(10),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE channel_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  points BIGINT DEFAULT 0,
  total_earned BIGINT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, channel_id)
);

CREATE TABLE channel_point_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  cost INTEGER NOT NULL,
  image_url VARCHAR(500),
  is_enabled BOOLEAN DEFAULT TRUE,
  is_paused BOOLEAN DEFAULT FALSE,
  max_per_stream INTEGER,
  max_per_user INTEGER,
  redemption_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE point_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID REFERENCES channel_point_rewards(id),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING',
  user_input TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  duration_seconds INTEGER DEFAULT 60,
  total_votes INTEGER DEFAULT 0,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  vote_count INTEGER DEFAULT 0
);

CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  winning_option_id UUID,
  prediction_window INTEGER DEFAULT 30,
  lock_at TIMESTAMP,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE prediction_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID REFERENCES predictions(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  color VARCHAR(20),
  total_points BIGINT DEFAULT 0,
  participant_count INTEGER DEFAULT 0
);

CREATE TABLE prediction_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID REFERENCES predictions(id) ON DELETE CASCADE,
  option_id UUID REFERENCES prediction_options(id),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  points_wagered INTEGER NOT NULL,
  points_won INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  banned_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  banned_by UUID REFERENCES users(id),
  reason TEXT,
  is_timeout BOOLEAN DEFAULT FALSE,
  timeout_until TIMESTAMP,
  is_permanent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE moderators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  added_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(channel_id, user_id)
);

CREATE TABLE banned_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  word VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200),
  message TEXT,
  channel_id UUID REFERENCES channels(id),
  actor_id UUID REFERENCES users(id),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE raids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raiding_channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  target_channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  viewer_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gifter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES users(id),
  quantity INTEGER DEFAULT 1,
  tier VARCHAR(10) DEFAULT 'TIER1',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  message TEXT,
  stripe_payment_id VARCHAR(200),
  status VARCHAR(20) DEFAULT 'COMPLETED',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE stream_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  title VARCHAR(140),
  category_id UUID REFERENCES categories(id),
  scheduled_at TIMESTAMP NOT NULL,
  duration_minutes INTEGER DEFAULT 180,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule VARCHAR(200),
  is_cancelled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email_on_live BOOLEAN DEFAULT TRUE,
  email_on_follow BOOLEAN DEFAULT TRUE,
  email_on_sub BOOLEAN DEFAULT TRUE,
  push_on_live BOOLEAN DEFAULT TRUE,
  chat_color VARCHAR(7) DEFAULT '#53fc18',
  dark_mode BOOLEAN DEFAULT TRUE,
  autoplay BOOLEAN DEFAULT TRUE,
  default_quality VARCHAR(10) DEFAULT 'auto',
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id),
  viewer_count INTEGER DEFAULT 0,
  chat_rate INTEGER DEFAULT 0,
  new_follows INTEGER DEFAULT 0,
  new_subs INTEGER DEFAULT 0,
  snapshot_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX chat_messages_channel_created_idx ON chat_messages(channel_id, created_at DESC);
CREATE INDEX follows_follower_idx ON follows(follower_id);
CREATE INDEX follows_following_idx ON follows(following_id);
CREATE INDEX subscriptions_channel_active_idx ON subscriptions(channel_id, is_active);
CREATE INDEX streams_channel_started_idx ON streams(channel_id, started_at DESC);
CREATE INDEX notifications_user_read_idx ON notifications(user_id, is_read);
CREATE INDEX channel_points_user_channel_idx ON channel_points(user_id, channel_id);
CREATE INDEX analytics_snapshots_stream_snapshot_idx ON analytics_snapshots(stream_id, snapshot_at);
