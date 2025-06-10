import { ReliefGrid } from "./mesh.relief.js";

export function test1(outputLine) {
    const reliefMesh2x2 = new ReliefGrid(1, 1, 10);
    reliefMesh2x2.dump(outputLine, "1> ");
    //reliefMesh2x2.dumpGraphviz(outputLine, "");
}

export function test2(outputLine) {
    const reliefMesh4x4 = new ReliefGrid(2, 2, 10);
    reliefMesh4x4.dump(outputLine, "2>");
    //reliefMesh4x4.dumpGraphviz(outputLine, "");
}
