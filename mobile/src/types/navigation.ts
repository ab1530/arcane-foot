import type { CalendarMatch } from './calendar';
import type { ExtractedReportData } from './voice-to-report';
import type { HardwareSessionType } from './hardware';

export type LabPresetMinutes = 20 | 45 | 90;

export type AppStackParamList = {
  MainTabs: undefined;
  Dashboard: undefined;
  Analytics: undefined;
  Market: undefined;
  ClubNeeds:
    | {
        addToShare?: {
          requestId?: string;
          lineNumber: number;
          player: {
            playerId: string;
            firstName?: string | null;
            lastName?: string | null;
            position?: string | null;
            nationality?: string | null;
            marketValue?: number | null;
            club?: { id?: string; name?: string; logo?: string | null } | null;
            photoUrl?: string | null;
          };
        };
      }
    | undefined;
  Camps: undefined;
  AI: undefined;
  ArcaneGPT: undefined;
  ArcaneIndex: undefined;
  ArkaneMatch: undefined;
  SmartScout: undefined;
  AutoScout: undefined;
  AutoScoutHistory: undefined;
  MarketValue: { playerId?: string };
  MarketValueDetail: { playerId: string };
  Players: undefined;
  ScoutQuickImport: undefined;
  AgentRequests: undefined;
  ScoutsDirectory: undefined;
  ScoutAdminDetail: {
    scout: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatar?: string | null;
      reportsCount: number;
      createdAt: string;
      lastLoginAt: string | null;
    };
  };
  PlayerDetail: { playerId: string };
  PlayerPassport: { playerId: string; player?: any };
  PlayerHighlights: { playerId: string; mode?: 'owner' | 'adminView' };
  Matches: undefined;
  Kanban: undefined;
  CreateReport:
    | {
        playerId?: string;
        matchId?: string;
        playerIds?: string[];
        assignmentId?: string;
        prefillData?: ExtractedReportData;
        fromVoice?: boolean;
        voicePayload?: {
          transcription?: string;
          confidence?: number;
          audioUrl?: string;
          warnings?: string[];
        };
      }
    | undefined;
  HardwareSessions: { playerId?: string; playerName?: string } | undefined;
  HardwareSessionDetail: { sessionId: string };
  ConnectGpsTracker:
    | {
        prefillLabMode?: boolean;
        prefillLabPresetMinutes?: LabPresetMinutes;
        preselectedSessionType?: HardwareSessionType;
      }
    | undefined;
  ImportGpsSession: {
    deviceId: string;
    deviceName?: string;
    initialMode?: 'device' | 'lab';
    initialLabPresetMinutes?: LabPresetMinutes;
    preselectedSessionType?: HardwareSessionType;
  };
  QCBand: undefined;
  CampDetail: { campId: string };
  MyCamps: undefined;
  CreateCamp: undefined;
  ClubDetail: { clubId: string };
  Clubs: undefined;
  Reports: undefined;
  Calendar: undefined;
  MissionRequests:
    | {
        preselectedMatchId?: string;
        preselectedScoutId?: string;
        preopenCreateForm?: boolean;
        preopenScoutMenu?: boolean;
      }
    | undefined;
  ReportDetail: { reportId: string };
  MatchDetail:
    | {
        match?: CalendarMatch;
        matchId?: string;
        assignmentId?: string;
        suggestedPlayerIds?: string[];
      }
    | undefined;
  Membership: undefined;
  About: undefined;
  Contact: undefined;
  Services: undefined;
  Passport: undefined;
  ScoutProfile: undefined;
  PassportPreview: {
    playerId: string;
    source?: {
      requestId?: string;
      lineNumber?: number;
      clubName?: string;
    };
  };
  VoiceToReport:
    | {
        matchId?: string;
        playerId?: string;
        playerIds?: string[];
        assignmentId?: string;
      }
    | undefined;
  Settings: undefined;
  PlayerComparison: undefined;
  Marketplace: undefined;
  ScoutDetail: { listingId: string };
  CreateOffer: { listingId: string };
  GlobalSearch: undefined;
  LoggingTest: undefined;
  LogConsole: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  AIHub: undefined;
  Marketplace: undefined;
  Camps: undefined;
  Coaching: undefined;
  Passport: undefined;
  Profile: undefined;
  News: undefined;
};
