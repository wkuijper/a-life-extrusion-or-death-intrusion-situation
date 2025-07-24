import {
	strM3,
	scaleV3, normalizeV3, multM3, multM3V3,
} from "./linalg.js";

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
    
	report.expandPath("/rotations");
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

	// set up vectors etc.

	const axisVector = [1, 1, 1];
	const normalizedAxisVector = normalizeV3(axisVector);
	const axisArrowLength = 3;
	const axisArrowStartPos = scaleV3(-(axisArrowLength/4), axisVector);

	// set up scene
	
	const scene = new THREE.Scene();

	const markers = [
		{ pos: [.5, .5, .5], colorCode: 0xff0000, /* red */ },
		{ pos: [.5, .5, -.5], colorCode: 0x00ff00, /* green */ },
		{ pos: [.5, -.5, .5], colorCode: 0x0000ff, /* blue */ },
		{ pos: [.5, -.5, -.5], colorCode: 0xFFFF00, /* ... */ },
		{ pos: [-.5, .5, .5], colorCode: 0x0FF00FF, /* ... */ },
		{ pos: [-.5, .5, -.5], colorCode: 0x00FFFF, /* ... */ },
		{ pos: [-.5, -.5, .5], colorCode: 0xFFFFFF, /* ... */ },
		{ pos: [-.5, -.5, -.5], colorCode: 0x555555, /* ... */ },
	];
	
	const compiledMarkers = [];

	for (const marker of markers) {
		const {pos, colorCode} = marker;
		const color = new THREE.Color();
		color.setHex(colorCode);
		const sphereGeom = new THREE.SphereGeometry(
			.1, // radius 
			8, // widthSegments 
			8, // heightSegments 
		);
		const sphereMaterial = new THREE.MeshBasicMaterial({
		    color: color,
		});
		const sphereMesh = new THREE.Mesh(sphereGeom, sphereMaterial);
		sphereMesh.position.set(...pos);
		scene.add(sphereMesh);
		const compiledMarker = {
			pos: pos,
			rotatedPos: pos,
			colorCode: colorCode,
			color: color,
			geom: sphereGeom,
			material: sphereMaterial,
			mesh: sphereMesh,
		};
		compiledMarkers.push(compiledMarker);
	}
	
	const boxGeom = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();
	const boxMat = new THREE.MeshBasicMaterial({
	    //vertexColors: true,
		wireframe: true,
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
	
	const axisHelper = new THREE.ArrowHelper(
		new THREE.Vector3(...normalizedAxisVector), 
		new THREE.Vector3(...axisArrowStartPos),
		axisArrowLength
	);
	scene.add(axisHelper);
	
	// set up tiles

	const tileWidth = 200;
	const tileHeight = 160;
	const tileGridWidth = 2;
	const tileGridHeight = 2;
	const numberOfTiles = tileGridHeight * tileGridWidth;

	const canvasWidth = tileWidth * tileGridWidth;
	const canvasHeight = tileHeight * tileGridHeight;

	const tiles = [
		{
			index: 0,
			mnemonic: "UL",
			camera: (() => {
				const camera = new THREE.OrthographicCamera( 
					-2, // left 
					2, // right
					((2 + 2) * (tileHeight/tileWidth)) / 2, // top
					-((2 + 2) * (tileHeight/tileWidth)) / 2, // bottom
					.1, // near clipping plane 
					10000, // far clipping plane 
				);
				camera.position.set(2, 2, 2);
				camera.lookAt(0, 0, 0);
				camera.updateProjectionMatrix();
				return camera;
			})(),
		},
		{
			index: 1,
			mnemonic: "UR",
			camera: (() => {
				const camera = new THREE.OrthographicCamera( 
					-2, // left 
					2, // right
					((2 + 2) * (tileHeight/tileWidth)) / 2, // top
					-((2 + 2) * (tileHeight/tileWidth)) / 2, // bottom
					.1, // near clipping plane 
					10000, // far clipping plane 
				);
				camera.position.set(0, 5, 0);
				camera.lookAt(0, 0, 0);
				camera.updateProjectionMatrix();
				return camera;
			})(),
		},
		{
			index: 2,
			mnemonic: "LL",
			camera: (() => {
				const camera = new THREE.OrthographicCamera( 
					-2, // left 
					2, // right
					((2 + 2) * (tileHeight/tileWidth)) / 2, // top
					-((2 + 2) * (tileHeight/tileWidth)) / 2, // bottom
					.1, // near clipping plane 
					10000, // far clipping plane 
				);
				camera.position.set(5, 0, 0);
				camera.lookAt(0, 0, 0);
				camera.updateProjectionMatrix();
				return camera;
			})(),
		},
		{
			index: 3,
			mnemonic: "LR",
			camera: (() => {
				const camera = new THREE.PerspectiveCamera(
					50, // FOV
					tileWidth / tileHeight, // aspect
					0.1, // near clipping plane
					10000, // far clipping plane
				);
				camera.position.set(2, 3, 4);
				camera.lookAt(0, 0, 0);
				camera.updateProjectionMatrix();
				return camera;
			})(),
		},
	];
	
	if (tiles.length !== numberOfTiles) {
		throw new Error(`invariant violation`);
	}

	// generate frames 
	
	const aniFrames = [];

	const frameCanvas = report.createCanvas(canvasWidth, canvasHeight);
	const frameCanvasCtx = frameCanvas.getContext("2d");

	const compiledTiles = new Array(numberOfTiles);
	let tileIndex = 0;
	for (let v = 0; v < tileGridHeight; v++) {
		for (let h = 0; h < tileGridWidth; h++) {
			const tile = tiles[tileIndex];
			if (tile.index !== tileIndex) {
				throw new Error(`invariant violation`);
			}
			const tileCanvas = report.createCanvas(tileWidth, tileHeight);
			const tileRenderer = new THREE.WebGLRenderer({canvas: tileCanvas});
			const compiledTile = {
				camera: tile.camera,
				canvas: tileCanvas,
				renderer: tileRenderer,
				x0: h * tileWidth,
				y0: v * tileHeight,
			};
			compiledTiles[tileIndex] = compiledTile;
			tileIndex++;			
		}
	}
	
	const renderFrame = (caption) => {
		for (const compiledTile of compiledTiles) {
			const {
				camera,
				canvas,
				renderer,
				x0, y0,
			} = compiledTile;
			renderer.render(scene, camera);
			frameCanvasCtx.drawImage(canvas, x0, y0);			
		}
		aniFrames.push({
			url: frameCanvas.toDataURL(),
			caption: caption,
		});
	};
	
	renderFrame("Before rotation");    

	const angle = Math.PI/8;
	
	report.outputLine(`boxMesh.quaternion: ${boxMesh.quaternion.toArray()}`);
	
	boxMesh.rotateOnAxis(
		new THREE.Vector3(...normalizedAxisVector), 
		angle
	);

	const rotationQuaternion = rotationQuaternionAboutAxis(
		angle,
		normalizedAxisVector,
	);

	report.outputLine(`rotationQuaternion: ${strQ(rotationQuaternion)}`);
	
	report.outputLine(`boxMesh.quaternion: ${boxMesh.quaternion.toArray()}`);
	
	const rotationMatrix = rotationMatrixForQuaternion(
		rotationQuaternion
	);

	report.outputLine(`rotationMatrix: ${strM3(rotationMatrix)}`);

	const threeRotationMatrix = new THREE.Matrix4();
	threeRotationMatrix.makeRotationAxis (new THREE.Vector3(...normalizedAxisVector), angle);
	
	report.outputLine(`THREE.rotationMatrix: ${threeRotationMatrix.elements}`);

	for (const compiledMarker of compiledMarkers) {
		const {
			pos,
			mesh,
		} = compiledMarker;
		const rotatedPos = multM3V3(rotationMatrix, pos);
		compiledMarker.rotatedPos = rotatedPos;
		mesh.position.set(...rotatedPos);
	}
	
	renderFrame("After rotation");
	
	report.logAnimation(aniFrames);
}