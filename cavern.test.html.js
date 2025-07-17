import { TestReport } from "./html.test.js";
import { test } from "./cavern.test.js";

const report = new TestReport(document.body, "Cavern Tests");

test(report);