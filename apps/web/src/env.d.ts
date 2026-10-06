type Env = {
  RESEND_API_KEY: string;
  RESEND_SEGMENT_ID: string;
  RESEND_FROM_EMAIL?: string;
};

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}
