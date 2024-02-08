export type LightningClientSession = {
  data: {
    k1: string;
    lnurl: string;
  };
  intervals: {
    poll: number;
    create: number;
  };
  query: {
    state: string;
    redirectUri: string;
  };
};

export type NostrClientSession = {
  data: {
    k1: string;
  };
  query: {
    state: string;
    redirectUri: string;
  };
};
