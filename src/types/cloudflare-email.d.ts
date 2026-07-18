/**
 * Minimal ambient types for Cloudflare's native "Send Email" Worker
 * binding (part of Email Routing). Deliberately hand-written and scoped
 * to just what we use, instead of pulling in the full
 * `@cloudflare/workers-types` package — that package redeclares globals
 * (Response, Request, crypto, ...) that conflict with the "dom" lib this
 * project relies on everywhere else.
 *
 * Docs: https://developers.cloudflare.com/email-routing/email-workers/send-email-workers/
 */
declare module "cloudflare:email" {
  export class EmailMessage {
    constructor(from: string, to: string, raw: string);
    readonly from: string;
    readonly to: string;
  }
}

type SendEmailBinding = {
  send(message: import("cloudflare:email").EmailMessage): Promise<void>;
};

declare global {
  interface CloudflareEnv {
    SEND_EMAIL?: SendEmailBinding;
  }
}

export {};
