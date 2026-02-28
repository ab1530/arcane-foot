describe('Feature flags env parsing', () => {
  const originalNewFlow = process.env.EXPO_PUBLIC_SCOUT_NEW_FLOW_ENABLED;
  const originalScoutProfile = process.env.EXPO_PUBLIC_SCOUT_PROFILE_SCREEN_ENABLED;
  const originalMissionHub = process.env.EXPO_PUBLIC_MISSION_REQUEST_HUB_ENABLED;

  const loadFlags = () => {
    jest.resetModules();
    return require('../features').FEATURE_FLAGS;
  };

  afterEach(() => {
    if (typeof originalNewFlow === 'undefined') {
      delete process.env.EXPO_PUBLIC_SCOUT_NEW_FLOW_ENABLED;
    } else {
      process.env.EXPO_PUBLIC_SCOUT_NEW_FLOW_ENABLED = originalNewFlow;
    }

    if (typeof originalScoutProfile === 'undefined') {
      delete process.env.EXPO_PUBLIC_SCOUT_PROFILE_SCREEN_ENABLED;
    } else {
      process.env.EXPO_PUBLIC_SCOUT_PROFILE_SCREEN_ENABLED = originalScoutProfile;
    }

    if (typeof originalMissionHub === 'undefined') {
      delete process.env.EXPO_PUBLIC_MISSION_REQUEST_HUB_ENABLED;
    } else {
      process.env.EXPO_PUBLIC_MISSION_REQUEST_HUB_ENABLED = originalMissionHub;
    }
  });

  it('defaults scout flags to true when env vars are missing', () => {
    delete process.env.EXPO_PUBLIC_SCOUT_NEW_FLOW_ENABLED;
    delete process.env.EXPO_PUBLIC_SCOUT_PROFILE_SCREEN_ENABLED;
    delete process.env.EXPO_PUBLIC_MISSION_REQUEST_HUB_ENABLED;

    const flags = loadFlags();
    expect(flags.scoutNewFlow).toBe(true);
    expect(flags.scoutProfileScreen).toBe(true);
    expect(flags.missionRequestHub).toBe(true);
  });

  it('parses explicit false values', () => {
    process.env.EXPO_PUBLIC_SCOUT_NEW_FLOW_ENABLED = 'false';
    process.env.EXPO_PUBLIC_SCOUT_PROFILE_SCREEN_ENABLED = '0';
    process.env.EXPO_PUBLIC_MISSION_REQUEST_HUB_ENABLED = 'off';

    const flags = loadFlags();
    expect(flags.scoutNewFlow).toBe(false);
    expect(flags.scoutProfileScreen).toBe(false);
    expect(flags.missionRequestHub).toBe(false);
  });

  it('parses explicit true aliases', () => {
    process.env.EXPO_PUBLIC_SCOUT_NEW_FLOW_ENABLED = 'yes';
    process.env.EXPO_PUBLIC_SCOUT_PROFILE_SCREEN_ENABLED = 'on';
    process.env.EXPO_PUBLIC_MISSION_REQUEST_HUB_ENABLED = '1';

    const flags = loadFlags();
    expect(flags.scoutNewFlow).toBe(true);
    expect(flags.scoutProfileScreen).toBe(true);
    expect(flags.missionRequestHub).toBe(true);
  });

  it('falls back to default for unknown values', () => {
    process.env.EXPO_PUBLIC_SCOUT_NEW_FLOW_ENABLED = 'not-a-bool';
    process.env.EXPO_PUBLIC_SCOUT_PROFILE_SCREEN_ENABLED = 'maybe';
    process.env.EXPO_PUBLIC_MISSION_REQUEST_HUB_ENABLED = 'n/a';

    const flags = loadFlags();
    expect(flags.scoutNewFlow).toBe(true);
    expect(flags.scoutProfileScreen).toBe(true);
    expect(flags.missionRequestHub).toBe(true);
  });
});
