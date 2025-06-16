import { ReliefGrid } from "./mesh.relief.js";

export function test(report) {
    report.startSection("test0", "Test 0: Empty Mesh", "3316a98e2a454484f69911f2fad494a57b710550f2ef99b83db846242df05d81");
    test0(report);  
    report.endSection("test0");
    
    report.startSection("test1", "Test 1: Single Tile Mesh");
    test1(report);
    report.endSection("test1");
    
    report.startSection("test2", "Test 2: 2x2 Mesh");
    test2(report);
    report.endSection("test2");
    
    report.startSection("test3", "Test 3: 3x3 Mesh");
    test3(report);
    report.endSection("test3");
    
    report.startSection("test4", "Test 4: 4x4 Mesh");
    test4(report);
    report.endSection("test4");
}

function drawReliefMesh(report, reliefMesh) {
    const tileSize = reliefMesh.tileSize;
    const scale = 200 / tileSize;
    const fontSize = Math.round(.075 * tileSize * scale);
    const margin = 2 * fontSize;
    
    const [minX, minY, maxX, maxY] = reliefMesh.boundingBox();
    const bbWidth = maxX - minX;
    const bbHeight = maxY - minY;
     
    const canvas = report.createCanvas(Math.round(bbWidth * scale) + 2 * margin, 
                                       Math.round(bbHeight * scale) + 2 * margin);

    const offsetX = (-minX * scale) + margin;
    const offsetY = (-minY * scale) + margin;
    
    const ctx = canvas.getContext("2d");

    ctx.font = `${fontSize}px sans-serif`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    
    for (const halfEdge of reliefMesh.halfEdges) {
        const sourceVertex = halfEdge.sourceVertex;
        const targetVertex = halfEdge.targetVertex;
        const [sx, sy] = sourceVertex.getShiftedPosition();
        const [sxx, syy] = [offsetX + sx * scale, offsetY + sy * scale];
        const [tx, ty] = targetVertex.getShiftedPosition();
        const [txx, tyy] = [offsetX + tx * scale, offsetY + ty * scale];
        ctx.beginPath();
        ctx.moveTo(sxx, syy);
        ctx.lineTo(txx, tyy);
        ctx.stroke();
        const dxx = (txx - sxx);
        const dyy = (tyy - syy);
        const pxx = -dyy;
        const pyy = dxx;
        const norm = Math.sqrt(pxx * pxx + pyy * pyy);
        const nxx = pxx / norm;
        const nyy = pyy / norm;
        const mxx = (sxx + txx) / 2;
        const myy = (syy + tyy) / 2;
        const lxx = mxx - (nxx * fontSize);
        const lyy = myy - (nyy * fontSize);
        ctx.fillStyle = "black";
        ctx.fillText(`${halfEdge.idx}`, lxx, lyy);  
    }
    
    for (const vertex of reliefMesh.vertices) {
        const [x, y] = vertex.getShiftedPosition();
        const [xx, yy] = [offsetX + x * scale, offsetY + y * scale];
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.rect(xx - fontSize, yy - fontSize, 2 * fontSize, 2 * fontSize);
        ctx.fill();
        ctx.fillStyle = "black";
        ctx.fillText(`${vertex.idx}`, xx, yy);        
    }

    for (const face of reliefMesh.faces) {
        const [x, y] = face.getShiftedMedianPosition();
        const [xx, yy] = [offsetX + x * scale, offsetY + y * scale];
        ctx.fillStyle = "black";
        ctx.fillText(`${face.idx}`, xx, yy);        
    }
    
    report.logImage(canvas.toDataURL());
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
    
    report.startSection("unflipped", "Unflipped");
    report.startSection("dump", "Dump");
    reliefMesh1x1.dump(outputLine, prefix);
    report.endSection("dump");
    drawReliefMesh(report, reliefMesh1x1);
    report.endSection("unflipped");
    
    report.startSection("flipped", "Flipped");
    const intersectFace1 = reliefMesh1x1.locateFaceForVertical([2, 5]);
    intersectFace1.dump(outputLine, prefix + "intersectFace1 === ")
    intersectFace1.shard.flip();
    report.startSection("dump");
    reliefMesh1x1.dump(outputLine, prefix + "1> ");
    report.endSection("dump");
    drawReliefMesh(report, reliefMesh1x1);
    report.endSection("flipped");
}

export function test2(report) {
    const outputLine = report.outputLine;
    const prefix = "";
    const reliefMesh2x2 = new ReliefGrid(2, 2, 10);
    reliefMesh2x2.dump(outputLine, prefix);
    drawReliefMesh(report, reliefMesh2x2);
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
    drawReliefMesh(report, reliefMesh3x3);
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
    drawReliefMesh(report, reliefMesh4x4);
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
