import { TestReport } from "./html.test.js";
import { test } from "./mesh.relief.test.js";

const report = new TestReport(document.body, "Relief Tests");

test(report);
