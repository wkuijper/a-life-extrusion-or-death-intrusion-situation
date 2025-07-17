import { CavernGrid } from "./cavern.js";
import * as THREE from "./three.module.js";

export function test(report) {
    report.startSection("test1", "Test 1: Single Gem Mesh", "");
    test1(report);
    report.endSection("test1");
	
	report.expandPath("/test1/dump");
}

export function test1(report) {
    const outputLine = report.outputLine;
    const prefix = "";
    const cavernGrid = new CavernGrid(1, 1, 1);
	const gem = cavernGrid.gems[0];
    
    report.startSection("dump", "Dump");
    cavernGrid._dump(outputLine, prefix);
    report.endSection("dump");
}