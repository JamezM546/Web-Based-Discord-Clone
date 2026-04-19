-- Create active_connections table for WebSocket connection management
-- This table tracks which users are connected via WebSocket connections

CREATE TABLE IF NOT EXISTS active_connections (
  connection_id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_ping TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_active_connections_user_id ON active_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_active_connections_updated_at ON active_connections(updated_at);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_active_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_ping = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER active_connections_updated_at_trigger
    BEFORE UPDATE ON active_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_active_connections_updated_at();

-- Add comments for documentation
COMMENT ON TABLE active_connections IS 'Tracks active WebSocket connections and their associated users';
COMMENT ON COLUMN active_connections.connection_id IS 'Unique identifier for the WebSocket connection from API Gateway';
COMMENT ON COLUMN active_connections.user_id IS 'ID of the user who owns this connection';
COMMENT ON COLUMN active_connections.created_at IS 'When the connection was established';
COMMENT ON COLUMN active_connections.updated_at IS 'Last time the connection metadata was updated';
COMMENT ON COLUMN active_connections.last_ping IS 'Last time the connection sent a ping/heartbeat';
