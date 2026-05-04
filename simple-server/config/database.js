const { Pool } = require('pg');

/**
 * On AWS Lambda, default localhost Postgres is never valid — fail fast with a clear message.
 */
function assertAwsLambdaDatabaseConfigured() {
  if (!process.env.AWS_LAMBDA_FUNCTION_NAME) return;

  const url = (process.env.DATABASE_URL || '').trim();
  if (url) {
    const u = url.toLowerCase();
    if (
      u.includes('@localhost') ||
      u.includes('@127.0.0.1') ||
      u.includes('://localhost') ||
      u.includes('://127.0.0.1')
    ) {
      throw new Error(
        '[Lambda] DATABASE_URL must point to real Postgres (e.g. RDS), not localhost. Set DATABASE_URL in the Lambda environment (or Secrets Manager).'
      );
    }
    return;
  }

  const host = (process.env.DATABASE_HOST || 'localhost').trim().toLowerCase();
  if (!host || host === 'localhost' || host === '127.0.0.1') {
    throw new Error(
      '[Lambda] Set DATABASE_URL to your Postgres connection string, or set DATABASE_HOST to your RDS endpoint — not localhost.'
    );
  }
}

assertAwsLambdaDatabaseConfigured();

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || 5432,
  database: process.env.DATABASE_NAME || 'discord-clone',
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  ssl: process.env.AWS_LAMBDA_FUNCTION_NAME
    ? { rejectUnauthorized: false }
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Initialize database tables
const initializeDatabase = async () => {
  try {
    // Wait for database to be ready
    await waitForDatabase();
    
    // Create tables if they don't exist
    await createTables();
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Wait for database connection
const waitForDatabase = async (maxRetries = 10, delay = 2000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('Database connection successful');
      return;
    } catch (error) {
      console.log(`Database connection attempt ${i + 1}/${maxRetries} failed: ${error.message}`);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  const host = process.env.DATABASE_HOST || 'localhost';
  const port = process.env.DATABASE_PORT || '5432';
  const db = process.env.DATABASE_NAME || '(unset)';
  throw new Error(
    [
      'Failed to connect to database after maximum retries.',
      `Tried: host=${host} port=${port} database=${db}`,
      '',
      'If you ran `npm test` on your machine (not in Docker):',
      '  • Start Postgres: from repo root run `docker compose up -d postgres` and wait until it is healthy.',
      '  • Port 5432 must reach that container (stop local PostgreSQL if it already uses 5432).',
      '  • Or skip host networking entirely: from `simple-server` run `npm run test:docker` (recommended).',
    ].join('\n')
  );
};

// Create all necessary tables
const createTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(50),
        avatar VARCHAR(500),
        status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'idle', 'dnd', 'offline')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Servers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS servers (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(500),
        owner_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Server members table
    await client.query(`
      CREATE TABLE IF NOT EXISTS server_members (
        id VARCHAR(255) PRIMARY KEY,
        server_id VARCHAR(255) NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(server_id, user_id)
      )
    `);
    
    // Channels table
    await client.query(`
      CREATE TABLE IF NOT EXISTS channels (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        server_id VARCHAR(255) REFERENCES servers(id) ON DELETE CASCADE,
        position INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(255) PRIMARY KEY,
        content TEXT NOT NULL,
        author_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        channel_id VARCHAR(255) REFERENCES channels(id) ON DELETE CASCADE,
        dm_id VARCHAR(255),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        edited BOOLEAN DEFAULT FALSE,
        reply_to_id VARCHAR(255) REFERENCES messages(id) ON DELETE SET NULL,
        server_invite_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CHECK (channel_id IS NOT NULL OR dm_id IS NOT NULL)
      )
    `);
    
    // Message reactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS message_reactions (
        id VARCHAR(255) PRIMARY KEY,
        message_id VARCHAR(255) NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        emoji VARCHAR(50) NOT NULL,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(message_id, emoji, user_id)
      )
    `);
    
    // Direct messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS direct_messages (
        id VARCHAR(255) PRIMARY KEY,
        participants TEXT[] NOT NULL,
        last_message_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Friend requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS friend_requests (
        id VARCHAR(255) PRIMARY KEY,
        from_user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        to_user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CHECK (from_user_id != to_user_id)
      )
    `);
    
    // Server invites table
    await client.query(`
      CREATE TABLE IF NOT EXISTS server_invites (
        id VARCHAR(255) PRIMARY KEY,
        server_id VARCHAR(255) NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
        from_user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        to_user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        message_id VARCHAR(255) REFERENCES messages(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS server_invite_codes (
        id VARCHAR(255) PRIMARY KEY,
        code VARCHAR(64) UNIQUE NOT NULL,
        server_id VARCHAR(255) NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
        created_by VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMP,
        max_uses INTEGER DEFAULT 0,
        uses_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Channel read state table (tracks last read timestamp per user/channel)
    await client.query(`
      CREATE TABLE IF NOT EXISTS channel_read_state (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        channel_id VARCHAR(255) NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
        last_read_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, channel_id)
      )
    `);

    // DM read state table (tracks last read timestamp per user/DM)
    await client.query(`
      CREATE TABLE IF NOT EXISTS direct_message_read_state (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        dm_id VARCHAR(255) NOT NULL REFERENCES direct_messages(id) ON DELETE CASCADE,
        last_read_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, dm_id)
      )
    `);

    // Channel summaries cache table (24h cache per user/channel/options)
    await client.query(`
      CREATE TABLE IF NOT EXISTS channel_summaries (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        channel_id VARCHAR(255) NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
        format VARCHAR(20) DEFAULT 'paragraph',
        options_json TEXT,
        summary_text TEXT NOT NULL,
        message_count INTEGER NOT NULL,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Direct message summaries cache table (24h cache per user/DM/options)
    await client.query(`
      CREATE TABLE IF NOT EXISTS direct_message_summaries (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        dm_id VARCHAR(255) NOT NULL REFERENCES direct_messages(id) ON DELETE CASCADE,
        format VARCHAR(20) DEFAULT 'paragraph',
        options_json TEXT,
        summary_text TEXT NOT NULL,
        message_count INTEGER NOT NULL,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Channel previews cache table (short-lived previews per user/channel)
    await client.query(`
      CREATE TABLE IF NOT EXISTS channel_previews (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        channel_id VARCHAR(255) NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
        unread_count INTEGER NOT NULL,
        time_range TEXT,
        highlights JSONB NOT NULL,
        last_message_time TIMESTAMP,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // DM previews cache table (short-lived previews per user/DM)
    await client.query(`
      CREATE TABLE IF NOT EXISTS direct_message_previews (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        dm_id VARCHAR(255) NOT NULL REFERENCES direct_messages(id) ON DELETE CASCADE,
        unread_count INTEGER NOT NULL,
        time_range TEXT,
        highlights JSONB NOT NULL,
        last_message_time TIMESTAMP,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes for better performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_messages_dm_id ON messages(dm_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_messages_author_id ON messages(author_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_server_members_server_id ON server_members(server_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_server_members_user_id ON server_members(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_channels_server_id ON channels(server_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_server_invite_codes_server_id ON server_invite_codes(server_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_server_invite_codes_code ON server_invite_codes(code)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_channel_read_state_user_channel ON channel_read_state(user_id, channel_id)');
    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_dm_read_state_user_dm ON direct_message_read_state(user_id, dm_id)'
    );
    await client.query('CREATE INDEX IF NOT EXISTS idx_channel_summaries_user_channel ON channel_summaries(user_id, channel_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_channel_summaries_expires_at ON channel_summaries(expires_at)');
    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_dm_summaries_user_dm ON direct_message_summaries(user_id, dm_id)'
    );
    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_dm_summaries_expires_at ON direct_message_summaries(expires_at)'
    );
    await client.query('CREATE INDEX IF NOT EXISTS idx_channel_previews_user_channel ON channel_previews(user_id, channel_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_channel_previews_expires_at ON channel_previews(expires_at)');

    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_dm_previews_user_dm ON direct_message_previews(user_id, dm_id)'
    );
    await client.query('CREATE INDEX IF NOT EXISTS idx_dm_previews_expires_at ON direct_message_previews(expires_at)');
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  initializeDatabase
};
