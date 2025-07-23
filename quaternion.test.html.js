import { TestReport } from "./html.test.js";
import { test } from "./quaternion.test.js";

const report = new TestReport(document.body, "Quaternion Tests");

test(report);
