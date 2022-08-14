// for some reason this needs to be in a separate file for ts-jest -_-

/** App injection tokens */
export const AppTokens = {
  browserLoader: "BrowserLoader",
  receiptScanner: "ReceiptScanner",
  slackUserId: "SlackUserId",
  promptProvider: "PromptProvider",
} as const;
