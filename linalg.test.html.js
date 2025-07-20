import { TestReport } from "./html.test.js";
import { test } from "./linalg.test.js";

const report = new TestReport(document.body, "Linalg Tests");

test(report);