import passportService from '../passportService';

jest.mock('../api', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
  },
  logError: jest.fn(),
  logWarn: jest.fn(),
}));

jest.mock('../../lib/roles', () => ({
  isAdminRole: jest.fn(() => false),
}));

describe('passportService public url', () => {
  const originalPublicWebUrl = process.env.EXPO_PUBLIC_PUBLIC_WEB_URL;

  afterEach(() => {
    if (originalPublicWebUrl === undefined) {
      delete process.env.EXPO_PUBLIC_PUBLIC_WEB_URL;
    } else {
      process.env.EXPO_PUBLIC_PUBLIC_WEB_URL = originalPublicWebUrl;
    }
  });

  it('uses EXPO_PUBLIC_PUBLIC_WEB_URL when available', () => {
    process.env.EXPO_PUBLIC_PUBLIC_WEB_URL = 'https://arcane-steel.vercel.app/';

    expect(passportService.generatePublicUrl('token-123')).toBe(
      'https://arcane-steel.vercel.app/passport/token-123',
    );
  });

  it('falls back to arcane-steel domain when env is missing', () => {
    delete process.env.EXPO_PUBLIC_PUBLIC_WEB_URL;

    expect(passportService.generatePublicUrl('token-456')).toBe(
      'https://arcane-steel.vercel.app/passport/token-456',
    );
  });

  it('keeps explicit baseUrl as highest priority', () => {
    process.env.EXPO_PUBLIC_PUBLIC_WEB_URL = 'https://arcane-steel.vercel.app';

    expect(passportService.generatePublicUrl('token-789', 'https://custom.arcane.app/')).toBe(
      'https://custom.arcane.app/passport/token-789',
    );
  });

  it('generateQRCodeValue mirrors generatePublicUrl', () => {
    process.env.EXPO_PUBLIC_PUBLIC_WEB_URL = 'https://arcane-steel.vercel.app';

    expect(passportService.generateQRCodeValue('token-qr')).toBe(
      'https://arcane-steel.vercel.app/passport/token-qr',
    );
  });
});
