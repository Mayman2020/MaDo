-- Add coins balance to users
ALTER TABLE kick_live.users ADD COLUMN IF NOT EXISTS coins_balance BIGINT DEFAULT 0;

-- Back-fill channels.total_views from streams aggregation
UPDATE kick_live.channels c
SET total_views = sub.sv
FROM (
    SELECT channel_id, COALESCE(SUM(total_views), 0) AS sv
    FROM kick_live.streams
    GROUP BY channel_id
) sub
WHERE c.id = sub.channel_id;

-- Performance indexes for leaderboard and live queries
CREATE INDEX IF NOT EXISTS idx_channels_total_views    ON kick_live.channels(total_views DESC);
CREATE INDEX IF NOT EXISTS idx_channels_follower_count ON kick_live.channels(follower_count DESC);
CREATE INDEX IF NOT EXISTS idx_channels_is_live        ON kick_live.channels(is_live) WHERE is_live = true;
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON kick_live.notifications(user_id) WHERE is_read = false;

-- Wallet transactions history
CREATE TABLE IF NOT EXISTS kick_live.wallet_transactions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES kick_live.users(id) ON DELETE CASCADE,
    coins            BIGINT NOT NULL,
    amount_cents     INTEGER NOT NULL,
    type             VARCHAR(20) NOT NULL DEFAULT 'PURCHASE',
    stripe_payment_id VARCHAR(200),
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON kick_live.wallet_transactions(user_id, created_at DESC);
