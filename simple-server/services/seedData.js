const { pool } = require('../config/database');

const minutesAgo = (min) => new Date(Date.now() - min * 60 * 1000).toISOString();
const hoursAgo = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
const weeksAgo = (weeks) => new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000).toISOString();

const seedDatabase = async () => {
  const client = await pool.connect();

  try {
    // Idempotent check — skip only if core seeded rows exist.
    // In dev/test, the DB can end up partially seeded (e.g. servers exist but messages are missing),
    // so we verify a representative message row rather than just the server row.
    const existing = await client.query("SELECT id FROM messages WHERE id = 'm1' LIMIT 1");
    if (existing.rows.length > 0) {
      console.log('Seed data already present — skipping.');
      return;
    }

    await client.query('BEGIN');

    // ── Servers ──────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO servers (id, name, icon, owner_id) VALUES
        ('s1', 'Team Project',  '🚀', '1'),
        ('s2', 'Gaming Squad',  '🎮', '2'),
        ('s3', 'Study Group',   '📚', '3')
      ON CONFLICT DO NOTHING
    `);

    // ── Server members ──────────────────────────────────────────────────
    await client.query(`
      INSERT INTO server_members (id, server_id, user_id, role) VALUES
        ('sm1',  's1', '1', 'owner'),
        ('sm2',  's1', '2', 'member'),
        ('sm3',  's1', '3', 'member'),
        ('sm4',  's1', '4', 'member'),
        ('sm5',  's1', '5', 'member'),
        ('sm6',  's2', '2', 'owner'),
        ('sm7',  's2', '1', 'member'),
        ('sm8',  's2', '3', 'member'),
        ('sm9',  's3', '3', 'owner'),
        ('sm10', 's3', '1', 'member'),
        ('sm11', 's3', '4', 'member'),
        ('sm12', 's3', '5', 'member')
      ON CONFLICT DO NOTHING
    `);

    // ── Channels ────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO channels (id, name, server_id, position) VALUES
        ('c1', 'general',       's1', 0),
        ('c2', 'announcements', 's1', 1),
        ('c3', 'development',   's1', 2),
        ('c4', 'general',       's2', 0),
        ('c5', 'game-night',    's2', 1),
        ('c6', 'general',       's3', 0),
        ('c7', 'homework-help', 's3', 1)
      ON CONFLICT DO NOTHING
    `);

    // ── Channel messages ────────────────────────────────────────────────
    // Team Project -> #general (messages from different time periods for date testing)
    await client.query(`
      INSERT INTO messages (id, content, author_id, channel_id, timestamp) VALUES
        ('m1',  'Hey everyone! Welcome to the project server! (Last week)',                          '1', 'c1', $1),
        ('m2',  'Thanks for setting this up! Excited to work together.',                            '2', 'c1', $2),
        ('m3',  'What features are we implementing first? (Yesterday)',                             '3', 'c1', $3),
        ('m4',  'I''m working on the user system - registration, login, and profiles.',             '1', 'c1', $4),
        ('m5',  'I''ll handle servers - creating, deleting, and settings.',                         '2', 'c1', $5),
        ('m6',  'I can take care of the channels - text channels with permissions.',                '3', 'c1', $6),
        ('m7',  'We''ll work on messaging - real-time chat, timestamps, edit/delete! (2 days ago)',  '4', 'c1', $7),
        ('m8',  'The emoji picker is working great! This morning.',                                 '5', 'c1', $8),
        ('m9',  'Should we have a meeting tomorrow to discuss the deadline?',                      '2', 'c1', $9),
        ('m10', 'Yes, let''s meet at 10 AM. I''ll prepare the agenda.',                           '1', 'c1', $10)
      ON CONFLICT DO NOTHING
    `, [
      weeksAgo(1), daysAgo(2), daysAgo(1), hoursAgo(6), hoursAgo(5),
      hoursAgo(4), daysAgo(2), hoursAgo(3), minutesAgo(30), minutesAgo(15),
    ]);

    // Team Project → #announcements
    await client.query(`
      INSERT INTO messages (id, content, author_id, channel_id, timestamp) VALUES
        ('m11', '📢 Important: Please review the project roadmap in the development channel.', '1', 'c2', $1),
        ('m12', '🎯 Milestone: We''ve completed 60% of the core features!',                   '2', 'c2', $2)
      ON CONFLICT DO NOTHING
    `, [minutesAgo(30), minutesAgo(10)]);

    // Team Project → #development
    await client.query(`
      INSERT INTO messages (id, content, author_id, channel_id, timestamp) VALUES
        ('m13', 'Just pushed the new authentication flow. Please test it!',         '1', 'c3', $1),
        ('m14', 'Found a bug in the server settings modal. Working on a fix.',      '2', 'c3', $2),
        ('m15', 'The channel permissions system is ready for review 🚀',             '3', 'c3', $3)
      ON CONFLICT DO NOTHING
    `, [minutesAgo(35), minutesAgo(20), minutesAgo(8)]);

    // Gaming Squad -> #general
    await client.query(`
      INSERT INTO messages (id, content, author_id, channel_id, timestamp) VALUES
        ('m16', 'Who''s up for a game tonight? (Last week)',                  '2', 'c4', $1),
        ('m17', 'I''m in! What are we playing? (Yesterday)',                  '1', 'c4', $2),
        ('m18', 'Let''s try that new co-op game everyone''s talking about', '3', 'c4', $3)
      ON CONFLICT DO NOTHING
    `, [weeksAgo(1), daysAgo(1), minutesAgo(90)]);

    // Study Group → #general
    await client.query(`
      INSERT INTO messages (id, content, author_id, channel_id, timestamp) VALUES
        ('m19', 'Has anyone started the assignment yet?',             '3', 'c6', $1),
        ('m20', 'I started it last night. The second question is tricky.', '4', 'c6', $2),
        ('m21', 'I can help with that one — let''s go over it together',   '5', 'c6', $3)
      ON CONFLICT DO NOTHING
    `, [minutesAgo(90), minutesAgo(85), minutesAgo(80)]);

    // ── Direct messages ─────────────────────────────────────────────────
    await client.query(`
      INSERT INTO direct_messages (id, participants, last_message_time) VALUES
        ('dm1', ARRAY['1','2'], $1),
        ('dm2', ARRAY['1','3'], $2)
      ON CONFLICT DO NOTHING
    `, [minutesAgo(5), minutesAgo(60)]);

    // DM messages: Nafisa ↔ Ashraf
    await client.query(`
      INSERT INTO messages (id, content, author_id, dm_id, timestamp) VALUES
        ('m22', 'Hey! Want to grab coffee after the meeting?', '2', 'dm1', $1),
        ('m23', 'Sure! How about the place downtown?',         '1', 'dm1', $2),
        ('m24', 'Perfect! See you at 2 PM ☕',                  '2', 'dm1', $3)
      ON CONFLICT DO NOTHING
    `, [minutesAgo(40), minutesAgo(25), minutesAgo(5)]);

    // DM messages: Nafisa ↔ James
    await client.query(`
      INSERT INTO messages (id, content, author_id, dm_id, timestamp) VALUES
        ('m25', 'Hey James, did you finish the backend spec?', '1', 'dm2', $1),
        ('m26', 'Almost done — just wrapping up the API docs.', '3', 'dm2', $2)
      ON CONFLICT DO NOTHING
    `, [minutesAgo(70), minutesAgo(60)]);

    // ── Friend requests ─────────────────────────────────────────────────
    await client.query(`
      INSERT INTO friend_requests (id, from_user_id, to_user_id, status) VALUES
        ('fr1', '1', '2', 'accepted'),
        ('fr2', '3', '1', 'accepted'),
        ('fr3', '1', '5', 'accepted'),
        ('fr4', '4', '1', 'pending')
      ON CONFLICT DO NOTHING
    `);

    await client.query('COMMIT');
    console.log('Seed data inserted successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding database:', error);
  } finally {
    client.release();
  }
};

module.exports = { seedDatabase };
