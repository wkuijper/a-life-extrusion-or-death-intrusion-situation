import {
	strQ, addQ, multQ, reciprocalQ, conjQ, 
	pureQuaternionForVector, 
	rotationQuaternionAboutAxis, 
	rotationMatrixForQuaternion,
} from "./quaternion.js";

import * as THREE from "./three.module.js";

import {OrbitControls} from "./three/examples/jsm/controls/OrbitControls.js";

export function test(report) {
    report.startSection("add", "Quaternion Addition", "e34162b100d24428ab3ad8d853536bf96de502a1c2474010fc7a2a621f379153");
    testAdd(report);  
    report.endSection("add");
    
    report.startSection("mult", "Quaternion Multiplication", "f5f39453c881369daca88848eb8a3306371df4e2b255dc2d0fbc8e96acf542c3");
    testMult(report);
    report.endSection("mult");
    
    report.startSection("reciprocal", "Quaternion Multiplicative Inversion", "83db892f06aa4fdf60055375823842a2a33699dafd284f5a54b48d94b024bcdc");
    testReciprocal(report);
    report.endSection("reciprocal");
    
    report.startSection("conj", "Quaternion Conjugation", "f39dbaf93cc575cd28018dc0c830ec4c3fe55808aa674280325101f8c625e4db");
    testConj(report);
    report.endSection("conj");
    
    report.startSection("rotations", "Quaternions for Rotations", "");
    testRotations(report);
    report.endSection("rotations");
    
	report.expandPath("/add");
}

export function testAdd(report) {
	const outputLine = report.outputLine;
    const prefix = "";
	
	const q = [4, [3, 4, 5]];
	const r = [2, [1, 2, 3]];
	const s = addQ(q, r);

	outputLine(`${strQ(q)} + ${strQ(r)} = ${strQ(s)}`);
}

export function testMult(report) {
	
	const outputLine = report.outputLine;
    const prefix = "";
	
	const q = [4, [3, 4, 5]];
	const r = [2, [1, 2, 3]];
	const s = multQ(q, r);

	const qT = new THREE.Quaternion(3, 4, 5, 4);
	const rT = new THREE.Quaternion(1, 2, 3, 2);
	const sT = qT.clone().multiply(rT);

	outputLine(`${strQ(q)} + ${strQ(r)} = ${strQ(s)} (${sT.toArray()})`);
}

export function testReciprocal(report) {
	const outputLine = report.outputLine;
    const prefix = "";
	
	const q = [4, [3, 4, 5]];
	const s = reciprocalQ(q);

	outputLine(`${strQ(q)} = ${strQ(s)}`);
}

export function testConj(report) {

	const outputLine = report.outputLine;
    const prefix = "";
	
	const q = [4, [3, 4, 5]];
	const s = conjQ(q);

	const qT = new THREE.Quaternion(3, 4, 5, 4);
	const sT = qT.clone().conjugate();

	outputLine(`conj${strQ(q)} = ${strQ(s)} (${sT.toArray()})`);
}

export function testRotations(report) {
	
	const scene = new THREE.Scene();
	
	const boxGeom = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();
	const boxMat = new THREE.MeshBasicMaterial({
	    vertexColors: true
	});
	const positionAttribute = boxGeom.getAttribute('position');
	const colors = [];

	const colorCodes = [
		0xff0000, // red
		0x00ff00, // green
		0x0000ff, // blue
		0xAAAA00, // ...
		0x00AAAA, 
		0xAA00AA
	];
	
	const colorObjects = colorCodes.map((colorCode) => {
		const color = new THREE.Color();
		color.setHex(colorCode);
		return color;
	});
	
	let j = 0;
	for (let i = 0; i < positionAttribute.count; i += 6) {
		const color = colorObjects[j % colorObjects.length];
		j++;
		
	    colors.push(color.r, color.g, color.b);
	    colors.push(color.r, color.g, color.b);
	    colors.push(color.r, color.g, color.b);

	    colors.push(color.r, color.g, color.b);
	    colors.push(color.r, color.g, color.b);
	    colors.push(color.r, color.g, color.b);
	}
	
	boxGeom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
	
	const boxMesh = new THREE.Mesh(boxGeom, boxMat);

	scene.add(boxMesh);

	////

	const width = 400;
	const height = 320;
	
	const canvas = report.createCanvas(width, height);
	
	const renderer = new THREE.WebGLRenderer({canvas: canvas});
	
	const camera = new THREE.PerspectiveCamera(
		50, // FOV
		width / height, // aspect
		0.1, // near clipping plane
		10000, // far clipping plane
	);

	const orbitControls = new OrbitControls(camera, renderer.domElement);
	//orbitControls.addEventListener('change', () => { needsRedraw = true; });
	
	camera.position.set(4 , 2, 2);
	camera.lookAt(0, 0, 0);
	camera.updateProjectionMatrix();
	
	orbitControls.update();

	const axesHelper = new THREE.AxesHelper(1000);
	scene.add(axesHelper);
	
	const ambientLight = new THREE.AmbientLight(0xffffff);
	scene.add(ambientLight);
	console.log(ambientLight);
	console.log(ambientLight.intensity);
	
	const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
	scene.add(directionalLight);
	console.log(directionalLight);
	console.log(directionalLight.intensity);
    
    renderer.render(scene, camera);

	const aniImgURLs = [];
	
    
	aniImgURLs.push({
		url: canvas.toDataURL(),
		caption: `Before rotation`,
	});

	const axis = new THREE.Vector3(1, 1, 1);
	
	axis.normalize();

	const origin = new THREE.Vector3(0, 0, 0);
	
	const axisHelper = new THREE.ArrowHelper(axis, origin, 2);

	scene.add(axisHelper);
	boxMesh.rotateOnAxis(axis, Math.PI/8);
    renderer.render(scene, camera);

	aniImgURLs.push({
		url: canvas.toDataURL(),
		caption: "After rotation",
	});
	report.logImages(aniImgURLs);

	
}