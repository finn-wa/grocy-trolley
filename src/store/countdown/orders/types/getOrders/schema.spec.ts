import { describeSchema } from "@gt/jtd/test-utils";
import samples from "./samples.json";
import { OrdersSchema } from "./schema";

/** Ensures the schema matches the samples */
describeSchema("OrdersSchema", OrdersSchema, samples);
