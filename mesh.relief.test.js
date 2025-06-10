import { ReliefGrid } from "./mesh.relief.js";

const outputLineToConsole = (str) => {
    console.log(str);
}

function test() {
    const reliefMesh2x2 = new ReliefGrid(1, 1);
    reliefMesh2x2.dump(outputLineToConsole, "1>");
    const reliefMesh4x4 = new ReliefGrid(2, 2);
    reliefMesh4x4.dump(outputLineToConsole, "2>");
}

test();