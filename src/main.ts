import { Logger } from "@gt/utils/logger";
import { exit } from "process";
import { runGT } from "./cli/gt-cli-commander";
import { RequestError } from "./utils/rest";

runGT().then(
  () => exit(0),
  (err) => {
    const logger = new Logger("main");
    if (err instanceof RequestError) {
      err.response.text().then(
        (text) => logger.error(text),
        () => exit(1)
      );
    } else {
      logger.error(err);
      exit(1);
    }
  }
);
