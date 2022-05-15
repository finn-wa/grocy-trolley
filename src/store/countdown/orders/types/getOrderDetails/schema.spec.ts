
import { describeSchema } from "@gt/jtd/test-utils";
import samples from "./samples.json";
import { OrderDetailsSchema } from "./schema";

/** Ensures the schema matches the samples */
describeSchema("OrderDetailsSchema", OrderDetailsSchema, samples);
