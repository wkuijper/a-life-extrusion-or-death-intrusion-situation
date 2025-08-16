import { TestReport } from "./html.test.js";
import { test } from "./realarbitrary.test.js";

const report = new TestReport(document.body, "Real Arbitrary Tests");

test(report);