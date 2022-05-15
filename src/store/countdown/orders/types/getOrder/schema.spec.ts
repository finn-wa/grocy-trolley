import { describeSchema } from "@gt/jtd/test-utils";
import samples from "./samples.json";
import { OrderSchema } from "./schema";

/** Ensures the schema matches the samples */
describeSchema("OrderSchema", OrderSchema, samples);
