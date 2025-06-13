import { ReliefGrid } from "./mesh.relief.js";

export function test1(outputLine) {
    const reliefMesh2x2 = new ReliefGrid(1, 1, 10);
    reliefMesh2x2.dump(outputLine, "1> ");
    const intersectFace1 = reliefMesh2x2.locateFaceForVertical([8, 2]);
    intersectFace1.dump(outputLine, "intersectFace1: ")
    intersectFace1.shard.flip();
    reliefMesh2x2.dump(outputLine, "1 flipped> ");
}

export function test2(outputLine) {
    const reliefMesh4x4 = new ReliefGrid(2, 2, 10);
    reliefMesh4x4.dump(outputLine, "2> ");
    const intersectFace1 = reliefMesh4x4.locateFaceForVertical([-1, 2]);
    intersectFace1.dump(outputLine, "intersectFace1: ");
    intersectFace1.shard.flip();
    const intersectFace2 = reliefMesh4x4.locateFaceForVertical([-5, -1]);
    intersectFace2.dump(outputLine, "intersectFace2: ");
    intersectFace2.shard.flip();
    const intersectFace3 = reliefMesh4x4.locateFaceForVertical([-12, -8]);
    intersectFace3.dump(outputLine, "intersectFace3: ");
    intersectFace3.shard.flip();
    reliefMesh4x4.dump(outputLine, "2 flipped> ");
}
