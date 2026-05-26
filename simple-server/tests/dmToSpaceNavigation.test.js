/**
 * Test: Creating a new space while viewing a DM should navigate away from the DM.
 *
 * Bug: When a user is in a DM and creates a new space, the frontend sets
 * selectedServer to the new space (causing its channels to appear in the sidebar)
 * but does NOT clear selectedDM (so the DM message area remains visible).
 * This makes the user think they are in the new space when they are still viewing
 * a DM conversation.
 *
 * This test simulates the frontend state transitions that AppContext.createServer
 * performs and asserts the expected post-creation state. The test FAILS because
 * createServer does not clear selectedDM or set selectedChannel.
 *
 * Reference:
 *   - AppContext.tsx createServer():  sets selectedServer but not selectedDM/selectedChannel
 *   - MainLayout.tsx handleSpaceClick(): correctly sets all three
 */
const { request, getToken, ensureInit } = require('./setup');

beforeAll(() => ensureInit(), 30000);

describe('DM-to-Space navigation bug', () => {
  /**
   * Simulates the frontend state that AppContext manages.
   * These mirror the React state variables in AppContext.tsx.
   */
  let selectedServer = null;
  let selectedChannel = null;
  let selectedDM = null;

  /**
   * Simulates what DMList.handleDMClick does when a user clicks on a DM:
   *   setSelectedDM(dm)
   *   setSelectedChannel(null)
   *   setSelectedServer(null)
   */
  function simulateDMClick(dm) {
    selectedDM = dm;
    selectedChannel = null;
    selectedServer = null;
  }

  /**
   * Simulates what AppContext.createServer does after the API call succeeds.
   * This is the BUGGY version — it mirrors the current code exactly:
   *   setSelectedServer(newServer)
   *   (does NOT clear selectedDM or set selectedChannel)
   */
  function simulateCreateServer_currentBehavior(newServer) {
    selectedServer = newServer;
    // BUG: missing these two lines:
    // selectedDM = null;
    // selectedChannel = first channel of newServer;
  }

  test('after creating a space while in a DM, selectedDM should be null', async () => {
    // Step 1: Fetch user's DMs (simulating being on the home/DM screen)
    const dmRes = await request
      .get('/api/direct-messages')
      .set('Authorization', `Bearer ${getToken()}`);

    expect(dmRes.status).toBe(200);
    const dms = dmRes.body.data.directMessages;
    expect(dms.length).toBeGreaterThanOrEqual(1);

    // Step 2: User clicks on a DM (simulating entering a DM conversation)
    const activeDM = dms[0];
    simulateDMClick(activeDM);

    expect(selectedDM).not.toBeNull();
    expect(selectedServer).toBeNull();
    expect(selectedChannel).toBeNull();

    // Step 3: While viewing the DM, user creates a new space
    const createRes = await request
      .post('/api/servers')
      .set('Authorization', `Bearer ${getToken()}`)
      .send({ name: 'New Space From DM', icon: '🚀' });

    expect(createRes.status).toBe(201);
    const newServer = createRes.body.data.server;

    // Step 4: Fetch channels for the new space (frontend does this in createServer)
    const channelsRes = await request
      .get(`/api/channels/server/${newServer.id}`)
      .set('Authorization', `Bearer ${getToken()}`);

    expect(channelsRes.status).toBe(200);
    const newChannels = channelsRes.body.data.channels;
    expect(newChannels.length).toBeGreaterThanOrEqual(1);

    // Step 5: Simulate the frontend state update (current buggy behavior)
    simulateCreateServer_currentBehavior(newServer);

    // --- Assertions for expected correct behavior ---

    // The new space should be selected (this PASSES - space is set)
    expect(selectedServer).not.toBeNull();
    expect(selectedServer.id).toBe(newServer.id);

    // The new space's channels should be visible in the sidebar (this PASSES)
    expect(newChannels.length).toBeGreaterThanOrEqual(1);

    // BUG ASSERTION: The DM should have been cleared when navigating to a new space.
    // This FAILS because createServer never calls setSelectedDM(null).
    // The user sees the new space's channels in the sidebar but the DM content
    // still occupies the message area.
    expect(selectedDM).toBeNull();
  });

  test('after creating a space while in a DM, selectedChannel should be set to the first channel', async () => {
    // Reset state
    selectedServer = null;
    selectedChannel = null;
    selectedDM = null;

    // Step 1: Enter a DM
    const dmRes = await request
      .get('/api/direct-messages')
      .set('Authorization', `Bearer ${getToken()}`);

    const activeDM = dmRes.body.data.directMessages[0];
    simulateDMClick(activeDM);

    // Step 2: Create a new space while in the DM
    const createRes = await request
      .post('/api/servers')
      .set('Authorization', `Bearer ${getToken()}`)
      .send({ name: 'Another Space From DM', icon: '🌟' });

    expect(createRes.status).toBe(201);
    const newServer = createRes.body.data.server;

    // Step 3: Fetch channels
    const channelsRes = await request
      .get(`/api/channels/server/${newServer.id}`)
      .set('Authorization', `Bearer ${getToken()}`);

    const newChannels = channelsRes.body.data.channels;

    // Step 4: Simulate current buggy behavior
    simulateCreateServer_currentBehavior(newServer);

    // BUG ASSERTION: selectedChannel should be set to the first channel of the
    // new space so the user sees the correct message area. This FAILS because
    // createServer never sets selectedChannel.
    expect(selectedChannel).not.toBeNull();
    expect(selectedChannel?.id).toBe(newChannels[0].id);
  });
});
