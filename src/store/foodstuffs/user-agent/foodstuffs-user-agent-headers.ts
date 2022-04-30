export const ALLOWED_HEADERS = [
  "Host",
  "User-Agent",
  "Accept",
  "Accept-Language",
  "Accept-Encoding",
  "Referer",
  "DNT",
  "Cookie",
  "Sec-Fetch-Dest",
  "Sec-Fetch-Mode",
  "Sec-Fetch-Site",
];

export const DISALLOWED_HEADERS = [
  "X-NewRelic-ID",
  "newrelic",
  "traceparent",
  "tracestate",
  "__RequestVerificationToken",
  "Connection",
  "Pragma",
  "Cache-Control",
  "TE",
];
