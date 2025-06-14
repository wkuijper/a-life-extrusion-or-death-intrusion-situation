import { ReliefGrid } from "./mesh.relief.js";

export function test(report) {
    report.startSection("Test 0: Empty Mesh");
    test0(report);  
    report.endSection("Test 0");
    
    report.startSection("Test 1: Single Tile Mesh");
    test1(report);
    report.endSection("Test 1");
    
    report.startSection("Test 2: 2x2 Mesh");
    test2(report);
    report.endSection("Test 2");
    
    report.startSection("Test 3: 3x3 Mesh");
    test3(report);
    report.endSection("Test 3");
    
    report.startSection("Test 4: 4x4 Mesh");
    test4(report);
    report.endSection("Test 4");
}

export function test0(report) {
    const outputLine = report.outputLine;
    const prefix = "";
    const reliefMesh0x0 = new ReliefGrid(0, 0, 10);
    reliefMesh0x0.dump(outputLine, prefix);
    const intersectFace1 = reliefMesh0x0.locateFaceForVertical([0, 0]);
    outputLine(`${prefix}${intersectFace1}`);
}

export function test1(report) {
    const outputLine = report.outputLine;
    const prefix = "";
    const reliefMesh1x1 = new ReliefGrid(1, 1, 10);
    reliefMesh1x1.dump(outputLine, prefix);
    const intersectFace1 = reliefMesh1x1.locateFaceForVertical([2, 5]);
    intersectFace1.dump(outputLine, prefix + "intersectFace1 === ")
    intersectFace1.shard.flip();
    reliefMesh1x1.dump(outputLine, prefix + "1> ");
}

export function test2(report) {
    const outputLine = report.outputLine;
    const prefix = "";
    const reliefMesh2x2 = new ReliefGrid(2, 2, 10);
    reliefMesh2x2.dump(outputLine, prefix);
    const intersectFace1 = reliefMesh2x2.locateFaceForVertical([18, 12]);
    intersectFace1.dump(outputLine, prefix + "intersectFace1: ")
    intersectFace1.shard.flip();
    reliefMesh2x2.dump(outputLine, prefix + "1> ");
    const intersectFace2 = reliefMesh2x2.locateFaceForVertical([8, 2]);
    intersectFace2.dump(outputLine, prefix + "2> intersectFace2: ")
    intersectFace2.shard.flip();
    reliefMesh2x2.dump(outputLine, prefix + "2> ");
}

export function test3(report) {
    const outputLine = report.outputLine;
    const prefix = "";
    const reliefMesh3x3 = new ReliefGrid(3, 3, 10);
    reliefMesh3x3.dump(outputLine, prefix);
    const intersectFace1 = reliefMesh3x3.locateFaceForVertical([19, 22]);
    intersectFace1.dump(outputLine, prefix + "intersectFace1: ");
    intersectFace1.shard.flip();
    const intersectFace2 = reliefMesh3x3.locateFaceForVertical([15, 19]);
    intersectFace2.dump(outputLine, prefix + "1> intersectFace2: ");
    intersectFace2.shard.flip();
    const intersectFace3 = reliefMesh3x3.locateFaceForVertical([8, 12]);
    intersectFace3.dump(outputLine, prefix + "2> intersectFace3: ");
    intersectFace3.shard.flip();
    reliefMesh3x3.dump(outputLine, prefix + "2> ");
}

export function test4(report) {
    const outputLine = report.outputLine;
    const prefix = "";
    const reliefMesh4x4 = new ReliefGrid(4, 4, 10);
    reliefMesh4x4.dump(outputLine, prefix);
    const intersectFace1 = reliefMesh4x4.locateFaceForVertical([19, 22]);
    intersectFace1.dump(outputLine, prefix + "intersectFace1: ");
    intersectFace1.shard.flip();
    const intersectFace2 = reliefMesh4x4.locateFaceForVertical([15, 19]);
    intersectFace2.dump(outputLine, prefix + "1> intersectFace2: ");
    intersectFace2.shard.flip();
    const intersectFace3 = reliefMesh4x4.locateFaceForVertical([8, 12]);
    intersectFace3.dump(outputLine, prefix + "2> intersectFace3: ");
    intersectFace3.shard.flip();
    reliefMesh4x4.dump(outputLine, prefix + "2> ");
}
