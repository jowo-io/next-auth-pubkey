import {
  QRGenerator,
  AvatarGenerator,
  NameGenerator,
} from "../../generators/types";

export type HardConfig = {
  apis: {
    // apis
    create: string;
    poll: string;
    callback: string;
    token: string;

    // pages
    lightningSignIn: string;
    nostrSignIn: string;

    // misc
    avatar: string;
    qr: string;
    diagnostics: string;
  };
  ids: {
    wrapper: string;
    title: string;
    qr: string;
    copy: string;
    button: string;
    loading: string;
    error: string;
    details: string;
  };
  intervals: {
    refreshToken: number;
    idToken: number;
  };
};

export type StorageSession = {
  k1: string;
  state: string;

  pubkey?: string | null;
  sig?: string | null;
  success?: boolean | null;

  // allow any other fields, they'll be ignored
  [key: string | number | symbol]: unknown;
};

export type RequiredConfig = {
  baseUrl: string;
  secret: string;
  storage: {
    set: (
      args: {
        k1: string;
        session: {
          k1: string;
          state: string;
        };
      },
      url: URL,
      config: Config
    ) => Promise<undefined>;
    get: (
      args: { k1: string },
      url: URL,
      config: Config
    ) => Promise<StorageSession | null | undefined>;
    update: (
      args: {
        k1: string;
        session: {
          pubkey: string;
          sig: string;
          success: boolean;
        };
      },
      url: URL,
      config: Config
    ) => Promise<undefined>;
    delete: (
      args: { k1: string },
      url: URL,
      config: Config
    ) => Promise<undefined>;
  };
  generateQr: QRGenerator;
};

export type ThemeStyles = {
  background: string;
  backgroundCard: string;
  text: string;
  signInButtonBackground: string;
  signInButtonText: string;
  qrBackground: string;
  qrForeground: string;
  qrMargin: number;
};

export type OptionalConfig = {
  pages: Partial<{
    lightningSignIn: string;
    nostrSignIn: string;
    error: string;
  }>;
  generateAvatar: AvatarGenerator | null;
  generateName: NameGenerator | null;
  flags: {
    diagnostics: boolean;
    logs: boolean;
  };
  theme: {
    colorScheme?: "light" | "dark";
  } & Partial<ThemeStyles>;
  intervals: {
    poll: number;
    create: number;
  };
};

export type UserConfig = RequiredConfig & Partial<OptionalConfig>;

export type Config = HardConfig &
  RequiredConfig &
  OptionalConfig & { theme: ThemeStyles };
