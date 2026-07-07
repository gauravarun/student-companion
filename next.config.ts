import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.118"],
};

export default withSentryConfig(nextConfig, {
  silent: true,
  // No Sentry auth token configured yet, so there's nothing to upload
  // sourcemaps with — disable it outright rather than fail/warn on every
  // build. Add SENTRY_ORG/SENTRY_PROJECT/SENTRY_AUTH_TOKEN and remove this
  // to get readable production stack traces.
  sourcemaps: { disable: true },
});
