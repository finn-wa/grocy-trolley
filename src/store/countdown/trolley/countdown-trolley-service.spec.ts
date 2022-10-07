import { expectSchemaToValidate } from "@gt/jtd/test-utils";
import { closeBrowser } from "@gt/store/shared/rest/browser";
import { container } from "tsyringe";
import { afterAll, beforeAll, beforeEach, describe, test } from "vitest";
import { CountdownAuthHeaderProvider } from "../rest/countdown-auth-header-provider";
import { beforeAllCountdownTests, countdownTestContainer } from "../test/countdown-test-utils";
import { CountdownTrolleyService } from "./countdown-trolley-service";
import { getTrolleySchema } from "./types/Trolley/schema";

describe("[external] CountdownTrolleyService", () => {
  let service: CountdownTrolleyService;

  beforeAll(() => beforeAllCountdownTests());

  beforeEach(() => {
    service = countdownTestContainer().resolve(CountdownTrolleyService);
  });

  afterAll(async () => closeBrowser());

  test("getTrolley", async () => {
    const svc = container.resolve(CountdownAuthHeaderProvider);
    expectSchemaToValidate(getTrolleySchema(), await service.getTrolley());
  });
});
