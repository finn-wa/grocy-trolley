
import { describeSchema } from "@gt/jtd/test-utils";
import samples from "./samples.json";
import { TrolleySchema } from "./schema";

/** Ensures the schema matches the samples */
describeSchema("TrolleySchema", TrolleySchema, samples);
