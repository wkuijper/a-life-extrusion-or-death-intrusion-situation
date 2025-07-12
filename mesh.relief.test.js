import { ReliefGrid } from "./mesh.relief.js";
import * as THREE from "./three.module.js";

export function test(report) {
    report.startSection("test0", "Test 0: Empty Mesh", "72cddb74a508990089ad20eac1b2199aaa02ec47192bb760e8dd8eba0082c5ad");
    test0(report);  
    report.endSection("test0");
    
    report.startSection("test1", "Test 1: Single Tile Mesh", "45725791c47b32618cc57b88343e2bceec3b0a01b83bc97d144a2cbc11a20c3d");
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
    
    report.startSection("test5", "Test 5: 16x16 Mesh");
    test5(report);
    report.endSection("test5");

    
    //report.expandPath("/test5");
    //report.expandPath("/test1/shiftSEU");
    //report.expandPath("/test1/shiftNWD");
	report.expandPath("/test1/shiftConcave");
}

function drawReliefMesh2D(report, reliefMesh) {
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
        ctx.fillStyle = "#777700";
        ctx.fillText(`${halfEdge.idx}`, lxx, lyy);  
    }
    
    for (const vertex of reliefMesh.vertices) {
        const [x, y] = vertex.getShiftedPosition();
        const [xx, yy] = [offsetX + x * scale, offsetY + y * scale];
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.rect(xx - fontSize, yy - fontSize, 2 * fontSize, 2 * fontSize);
        ctx.fill();
        ctx.fillStyle = "#880000";
        ctx.fillText(`${vertex.idx}`, xx, yy);        
    }

    for (const face of reliefMesh.faces) {
        const [x, y] = face.getShiftedMedianPosition();
        const [xx, yy] = [offsetX + x * scale, offsetY + y * scale];
        ctx.fillStyle = "#000044";
        ctx.fillText(`${face.idx}`, xx, yy);        
    }
    
    report.logImage(canvas.toDataURL());
}

function drawReliefMesh3D(report, reliefMesh, [width, height], [cameraX, cameraY, cameraZ]) {
    const tileSize = reliefMesh.tileSize;
    const scale = 200 / tileSize;
    const fontSize = Math.round(.075 * tileSize * scale);
    const margin = 2 * fontSize;
    const [minX, minY, maxX, maxY] = reliefMesh.boundingBox();

    const canvas = report.createCanvas(width, height);
    
	const renderer = new THREE.WebGLRenderer({canvas: canvas});

	const scene = new THREE.Scene();
	
	const camera = new THREE.PerspectiveCamera(
		50, // FOV
		width / height, // aspect
		0.1, // near clipping plane
		10000, // far clipping plane
	);

	//const cameraHelper = new THREE.CameraHelper(camera);
	//scene.add(cameraHelper);
	
	//orbitControls = new OrbitControls(camera, renderer.domElement);
	//orbitControls.addEventListener('change', () => { needsRedraw = true; });
	
	camera.position.set(cameraX, cameraY, cameraZ);
	camera.lookAt(0, 0, 0);
	camera.updateProjectionMatrix();
	//orbitControls.update();

	const axesHelper = new THREE.AxesHelper(1000);
	scene.add(axesHelper);
	
	//const boxGeometry = new THREE.BoxGeometry();
	//const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
	//const box = new THREE.Mesh(boxGeometry, boxMaterial);
	//scene.add(box);
	
	//const planeGeometry = new THREE.PlaneGeometry(1000, 1000, 20, 20);
	//const planeMaterial = new THREE.MeshStandardMaterial({ 
	//	color: 0x0000ff, side: THREE.DoubleSide, wireframe: true });
	//const plane = new THREE.Mesh(planeGeometry, planeMaterial);
	//plane.rotation.x += -.5 * Math.PI;
	
	//scene.add(plane);

	//const sphereGeometry = new THREE.SphereGeometry(
	//	50, // radius 
	//	16, // widthSegments
	//	16, // heightSegments
	//);
	//const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
	//const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
	//scene.add(sphere);

	//sphere.position.set(5, 15, 5);
	
	//const gridHelper = new THREE.GridHelper(1000);
	//scene.add(gridHelper);

	const ambientLight = new THREE.AmbientLight(0xffffff);
	scene.add(ambientLight);
	console.log(ambientLight);
	console.log(ambientLight.intensity);
	
	//const pointLight = new THREE.PointLight(0xffffff, 0);
    //pointLight.position.set(0, 100, 100);
	//scene.add(pointLight);
	//console.log(pointLight);
	//console.log(pointLight.intensity);

	//const pointLightHelper = new THREE.PointLightHelper(pointLight, 1000);
	//scene.add(pointLightHelper);
    
	const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
	scene.add(directionalLight);
	console.log(directionalLight);
	console.log(directionalLight.intensity);

	//const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 100);
    //scene.add(directionalLightHelper);

    const geometry = new THREE.BufferGeometry();

    const halfEdges = reliefMesh.halfEdges;
    const numberOfHalfEdges = halfEdges.length;
    
    const vertices = new Float32Array(numberOfHalfEdges * 3);
    const normals = new Float32Array(numberOfHalfEdges * 3);
    for (let i = 0; i < numberOfHalfEdges; i++) {
        const halfEdge = halfEdges[i];
        const targetVertex = halfEdge.targetVertex;
        const [x, y, z] = targetVertex.getShiftedPosition();
        const offset = i * 3;
        vertices[offset] = x;
        vertices[offset + 1] = y;
        vertices[offset + 2] = z;
        const [fx, fy, fz] = halfEdge.getTargetVertexFaceNormal();
        normals[offset] = fx;
        normals[offset + 1] = fy;
        normals[offset + 2] = fz;
    }

    for (let i = 0; i < numberOfHalfEdges; i++) {
        const halfEdge = halfEdges[i];
        const targetVertex = halfEdge.targetVertex;
        const [x, y, z] = targetVertex.getShiftedPosition();
        const offset = i * 3;
        vertices[offset] = x;
        vertices[offset + 1] = y;
        vertices[offset + 2] = z;
    }
    
    const faces = reliefMesh.faces;
    const numberOfFaces = faces.length;
    
    const indices = new Array(numberOfFaces);
    let ii = 0;
    for (let i = 0; i < numberOfFaces; i++) {
        const face = faces[i];
        let a = face.diagonalHalfEdge;
        let b = a.nextHalfEdge;
        let c = b.nextHalfEdge;
        indices[ii] = a.idx;
        ii++;
        indices[ii] = b.idx;
        ii++;
        indices[ii] = c.idx;
        ii++;
    }

    geometry.setIndex( indices );
    geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
    geometry.setAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );

    //geometry.computeVertexNormals();
        
    const material = new THREE.MeshStandardMaterial({ 
		color: 0x0000ff, 
        //side: THREE.DoubleSide, 
        wireframe: false,
        polygonOffset: true,
        polygonOffsetFactor: 1, // positive value pushes polygon further away
        polygonOffsetUnits: 1
    });
    
    const mesh = new THREE.Mesh( geometry, material );

    // wireframe
    var geo = new THREE.EdgesGeometry( mesh.geometry ); // or WireframeGeometry
    var mat = new THREE.LineBasicMaterial( { color: 0xffff00 } );
    var wireframe = new THREE.LineSegments( geo, mat );
    mesh.add( wireframe );
    
    scene.add(mesh);
    
    mesh.rotation.x += .5 * Math.PI;
    mesh.position.set(-(reliefMesh.width * reliefMesh.tileSize) / 2, 0, -(reliefMesh.height * reliefMesh.tileSize) / 2);
    
    renderer.render(scene, camera);
    
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
	const shard = reliefMesh1x1.shards[0];
    
    report.startSection("unflipped", "Unflipped");
    report.startSection("dump", "Dump");
    reliefMesh1x1.dump(outputLine, prefix);
    report.endSection("dump");
    drawReliefMesh2D(report, reliefMesh1x1);
    report.endSection("unflipped");
    
    report.startSection("flipped", "Flipped");
    const intersectFace1 = reliefMesh1x1.locateFaceForVertical([2, 5]);
    intersectFace1.dump(outputLine, prefix + "intersectFace1 === ")
    intersectFace1.shard.flip();
    report.startSection("dump", "Dump");
    reliefMesh1x1.dump(outputLine, prefix);
    report.endSection("dump");
    drawReliefMesh2D(report, reliefMesh1x1);
    report.endSection("flipped");

    report.startSection("shiftSEU", "Shift SEU");
    const nwVertex = shard.nwVertex;
    nwVertex.setShift([1.5, 2, 3]);
    
    report.startSection("dumpBeforeUpdate", "Dump Before Update");
    reliefMesh1x1.dump(outputLine, prefix);
    report.endSection("dumpBeforeUpdate");
    
    reliefMesh1x1.update(); 
    
    report.startSection("dumpAfterUpdate", "Dump After Update");
    reliefMesh1x1.dump(outputLine, prefix);
    report.endSection("dumpAfterUpdate");
    
    drawReliefMesh2D(report, reliefMesh1x1);
    reliefMesh1x1.update();
    drawReliefMesh3D(report, reliefMesh1x1, [400, 400], [10, 25, 10]);
    report.endSection("shiftSEU");

    report.startSection("shiftConcave", "Shift Concave");
    nwVertex.setShift([3.8, 3.8, 0]);
	const neVertex = shard.neVertex;
	neVertex.setShift([-3.8, -3.8, 0]);
	const swVertex = shard.swVertex;
	swVertex.setShift([-3.8, -3.8, 0]);
    report.startSection("dump", "Dump");
    reliefMesh1x1.dump(outputLine, prefix);
    report.endSection("dump");
    drawReliefMesh2D(report, reliefMesh1x1);
    drawReliefMesh3D(report, reliefMesh1x1, [400, 400], [10, 25, 10]);
    report.endSection("shiftConcave");
}

export function test2(report) {
    const outputLine = report.outputLine;
    const prefix = "";
    const reliefMesh2x2 = new ReliefGrid(2, 2, 10);
    reliefMesh2x2.dump(outputLine, prefix);
    drawReliefMesh2D(report, reliefMesh2x2);
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
    drawReliefMesh2D(report, reliefMesh3x3);
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
    drawReliefMesh2D(report, reliefMesh4x4);
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

export function test5(report) {
    const reliefMesh = new ReliefGrid(16, 16, 10);
    for (const vertex of reliefMesh.vertices) {
        const sx = Math.random() * 4 - 2;
        const sy = Math.random() * 4 - 2;
        const sz = Math.random() * 32 - 16;
        vertex.setShift([sx, sy, sz]);
    }
	for (const shard of reliefMesh.shards) {
		if (Math.random()) {
			shard.flip();
		}
	}
    drawReliefMesh3D(report, reliefMesh, [400, 400], [200, 300, 100]);
}