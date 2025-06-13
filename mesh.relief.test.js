import { ReliefGrid } from "./mesh.relief.js";

export function test(outputLine, prefix) {
    test0(outputLine, prefix + "test0> ");  
    test1(outputLine, prefix + "test1> ");   
    test2(outputLine, prefix + "test2> ");   
    test3(outputLine, prefix + "test3> ");    
}

export function test0(outputLine, prefix) {
    const reliefMesh0x0 = new ReliefGrid(0, 0, 10);
    reliefMesh0x0.dump(outputLine, prefix);
    const intersectFace1 = reliefMesh0x0.locateFaceForVertical([0, 0]);
    outputLine(`${prefix}${intersectFace1}`);
}

export function test1(outputLine, prefix) {
    const reliefMesh1x1 = new ReliefGrid(1, 1, 10);
    reliefMesh1x1.dump(outputLine, prefix);
    const intersectFace1 = reliefMesh1x1.locateFaceForVertical([2, 5]);
    intersectFace1.dump(outputLine, prefix + "intersectFace1 === ")
    intersectFace1.shard.flip();
    reliefMesh1x1.dump(outputLine, prefix + "1> ");
}

export function test2(outputLine, prefix) {
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

export function test3(outputLine, prefix) {
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
