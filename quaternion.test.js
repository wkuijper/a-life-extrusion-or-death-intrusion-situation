import {
	strM3,
	scaleV3, normalizeV3, multM3, multM3V3, identityM3,
} from "./linalg.js";

import {
	quaternionToString, 
	addQuaternions, 
	multiplyQuaternions, 
	reciprocateQuaternion, 
	conjugateQuaternion, 
	pureQuaternionForVector, 
	rotationQuaternionForAxisAngle, 
	rotationMatrixForQuaternion,
	rotateVectorByQuaternion,
	_gen__quaternionForRotationMatrix,
	quaternionForRotationMatrix,
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

	report.startSection("qfrm", "Quaternion for Rotation Matrix");

	//report.startSection("code", "Generated Code");
	//_gen__quaternionForRotationMatrix(report.outputLine, "", "    ");
	//report.endSection("code");
	
	testQFRM(report);
    
	report.endSection("qfrm");
	
    report.startSection("rotations", "Quaternions for Rotations", "");
    testRotations(report);
    report.endSection("rotations");
    
	report.expandPath("/qfrm/code");
}

export function testAdd(report) {
	const outputLine = report.outputLine;
    const prefix = "";
	
	const q = [3, 4, 5, 4];
	const r = [1, 2, 3, 2];
	const s = addQuaternions(q, r);

	outputLine(`${quaternionToString(q)} + ${quaternionToString(r)} = ${quaternionToString(s)}`);
}

export function testMult(report) {
	
	const outputLine = report.outputLine;
    const prefix = "";
	
	const q = [3, 4, 5, 4];
	const r = [1, 2, 3, 2];
	const s = multiplyQuaternions(q, r);

	const qT = new THREE.Quaternion(3, 4, 5, 4);
	const rT = new THREE.Quaternion(1, 2, 3, 2);
	const sT = qT.clone().multiply(rT);

	outputLine(`${quaternionToString(q)} + ${quaternionToString(r)} = ${quaternionToString(s)} (${sT.toArray()})`);
}

export function testReciprocal(report) {
	const outputLine = report.outputLine;
    const prefix = "";
	
	const q = [3, 4, 5, 4];
	const s = reciprocateQuaternion(q);

	outputLine(`${quaternionToString(q)} = ${quaternionToString(s)}`);

	const qq = multiplyQuaternions(s, q);

	outputLine(`${quaternionToString(qq)}`);
}

export function testConj(report) {

	const outputLine = report.outputLine;
    const prefix = "";
	
	const q = [3, 4, 5, 4];
	const s = conjugateQuaternion(q);

	const qT = new THREE.Quaternion(3, 4, 5, 4);
	const sT = qT.clone().conjugate();

	outputLine(`conj${quaternionToString(q)} = ${quaternionToString(s)} (${sT.toArray()})`);
}

export function testQFRM(report) {
	const outputLine = report.outputLine;
    const prefix = "";
	
	const m = identityM3();
	const s = quaternionForRotationMatrix(m);

	outputLine(`qfrm${strM3(m)} = ${quaternionToString(s)}`);

	const axis = normalizeV3([.3, .1, 5]);
	const angle = Math.PI/5;
	
	const q = rotationQuaternionForAxisAngle(axis, angle);
	
	const n = rotationMatrixForQuaternion(q);
	
	const t = quaternionForRotationMatrix(n);

	outputLine(`qfrm[...n] = ${quaternionToString(t)}`);
	outputLine(`          ?= ${quaternionToString(q)}`);
}

export function testRotations(report) {

	// set up vectors etc.

	const axisVector = [1, 1, 1];
	const normalizedAxisVector = normalizeV3(axisVector);
	const axisArrowLength = 2;

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
	const boxMat = new THREE.MeshStandardMaterial({
	    vertexColors: true,
		//wireframe: true,
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
	
	const ambientLight = new THREE.AmbientLight(0xffffff, 4);
	scene.add(ambientLight);
	
	const directionalLight = new THREE.DirectionalLight(0xffffff, 20);
	scene.add(directionalLight);

	/*const pointLight = new THREE.PointLight(0xffffff, 300);
	pointLight.position.set(-1, 2, 3);
	scene.add(pointLight);*/
	
	const axisHelper = new THREE.ArrowHelper(
		new THREE.Vector3(...normalizedAxisVector), 
		new THREE.Vector3(0, 0, 0),
		axisArrowLength
	);
	scene.add(axisHelper);

	const reset = () => {
		for (const compiledMarker of compiledMarkers) {
			const pos = compiledMarker.pos;
			compiledMarker.rotatedPos = pos;
			compiledMarker.mesh.position.set(...pos);
		}
		
		boxMesh.position.set(0, 0, 0);
		boxMesh.quaternion.set(0, 0, 0, 1);
		boxMesh.scale.set(1, 1, 1);

		axisHelper.setDirection(new THREE.Vector3(1, 0, 0));
	};
	
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

	// generate animations 

	report.startSection("single", "Single Rotation");
	
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
	
	renderFrame(`Before rotation`);    

	const angle = Math.PI/8;
	
	report.outputLine(`boxMesh.quaternion: ${boxMesh.quaternion.toArray()}`);
	
	boxMesh.rotateOnAxis(
		new THREE.Vector3(...normalizedAxisVector), 
		angle
	);

	const rotationQuaternion = rotationQuaternionForAxisAngle(
		normalizedAxisVector,
		angle,
	);

	report.outputLine(`rotationQuaternion: ${quaternionToString(rotationQuaternion)}`);
	
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

	report.endSection("single");
	
	//

	report.startSection("stacked", "Stacked Rotations");
	
	aniFrames.length = 0;

	reset();

	renderFrame("Before rotation over x-axis");

	const xAxis = [1, 0, 0];
	const yAxis = [0, 1, 0];
	const zAxis = [0, 0, 1];

	const angleFromDegrees = (degrees) => {
		return (degrees/180) * Math.PI;
	};

	const rotateByQuaternion = (quaternion) => {
		for (const compiledMarker of compiledMarkers) {
			const currPos = compiledMarker.rotatedPos;
			const rotatedPos = 
				rotateVectorByQuaternion(
					currPos, 
					quaternion
				);
			compiledMarker.rotatedPos = rotatedPos;
			compiledMarker.mesh.position.set(...rotatedPos);
		}
		boxMesh.quaternion.premultiply(new THREE.Quaternion(...quaternion));
	};

	const xRotationQuaternion = rotationQuaternionForAxisAngle(
		xAxis, 
		angleFromDegrees(30)
	);

	rotateByQuaternion(xRotationQuaternion);

	renderFrame("After rotation over x-axis");
	
	const yAxisRotatedOverX = 
		rotateVectorByQuaternion(
			yAxis,
			xRotationQuaternion
		);

	axisHelper.setDirection(
		new THREE.Vector3(...yAxisRotatedOverX)
	);
	
	renderFrame("Before rotation over rotated y-axis");
	
	const yRotationQuaternion = 
		rotationQuaternionForAxisAngle(
			yAxisRotatedOverX, 
			angleFromDegrees(15)
		);

	rotateByQuaternion(yRotationQuaternion)

	renderFrame("After rotation over rotated y-axis");

	const xyRotationQuaternion = 
		multiplyQuaternions(
				yRotationQuaternion,
				xRotationQuaternion 
			);
	
	const zAxisRotatedOverXandY = 
		rotateVectorByQuaternion(
			zAxis,
			xyRotationQuaternion
		);

	axisHelper.setDirection(
		new THREE.Vector3(...zAxisRotatedOverXandY)
	);
	
	renderFrame("Before rotation over rotated z-axis");
	
	const zRotationQuaternion = 
		rotationQuaternionForAxisAngle(
			zAxisRotatedOverXandY, 
			angleFromDegrees(20)
		);

	rotateByQuaternion(zRotationQuaternion)

	renderFrame("After rotation over rotated z-axis");
	
	const xyzRotationQuaternion = 
		multiplyQuaternions(
				zRotationQuaternion,
				xyRotationQuaternion 
			);

	const resetQuaternion = 
		reciprocateQuaternion(xyzRotationQuaternion);
	
	axisHelper.setDirection(
		new THREE.Vector3(...resetQuaternion)
	);
	
	renderFrame("Before rotation over combined reset axis");

	rotateByQuaternion(resetQuaternion);
	
	renderFrame("After rotation over combined reset axis");
	
	report.logAnimation(aniFrames);
	
	report.endSection("stacked");

}