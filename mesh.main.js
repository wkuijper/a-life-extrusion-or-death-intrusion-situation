import * as THREE from "./three.module.js";
import {OrbitControls} from "./three/examples/jsm/controls/OrbitControls.js";
import * as dat from "./dat.gui.module.js";
import { ReliefGrid } from "./mesh.relief.js";

let renderer;
let scene;
let camera;
let cameraHelper;
let orbitControls;
let ambientLight;

let pointLight;
let pointLightHelper;

let directionalLight;
let directionalLightHelper;

let sphere;
let plane;

let gui;
let guiOptions;

let needsRedraw = true;

let lastTimestamp = null;

function animationFrame(currTimestamp) {
    let timeStep;
    
    if (lastTimestamp === null) {
		timeStep = 50; // msec
		lastTimestamp = currTimestamp;
    } else {
		timeStep = currTimestamp - lastTimestamp;
		lastTimestamp = currTimestamp;
    }
    
    window.requestAnimationFrame(animationFrame);

    const width = window.innerWidth;
    const height = window.innerHeight;
	
	const currRendererSize = new THREE.Vector2();
	renderer.getSize(currRendererSize);
    
	if (currRendererSize.x !== width || 
		currRendererSize.y !== height) {
		console.log(`(re)sizing: ${width}, ${height}`);
        renderer.setSize(window.innerWidth, window.innerHeight);
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
		needsRedraw = true;
    }
	
    if (!needsRedraw) {
		return;
    }

	/*ctx.clearRect(0, 0, width, height);
	
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width, 0);
    ctx.lineTo(0, height);
    ctx.stroke();

    ctx.beginPath();
    ctx.font = "40px sans-serif";
    ctx.textBaseline = "hanging";
    ctx.textAlign = "left";
	const flooredTimestep = Math.floor(timeStep);
    ctx.fillText(`timeStep: ${flooredTimestep}`, 10, 10);*/

	renderer.render(scene, camera);
	
    needsRedraw = false;
}

function init3D() {
	const width = window.innerWidth;
    const height = window.innerHeight;
	
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(width, height);
	document.body.appendChild(renderer.domElement);

	scene = new THREE.Scene();
	
	camera = new THREE.PerspectiveCamera(
		50, // FOV
		width / height, // aspect
		0.1, // near clipping plane
		10000, // far clipping plane
	);

	cameraHelper = new THREE.CameraHelper(camera);
	scene.add(cameraHelper);
	
	orbitControls = new OrbitControls(camera, renderer.domElement);
	orbitControls.addEventListener('change', () => { needsRedraw = true; });
	
	camera.position.set (50, 50, 50);
	camera.lookAt(0, 0, 0);
	camera.updateProjectionMatrix();
	orbitControls.update();

	const axesHelper = new THREE.AxesHelper(1000);
	scene.add(axesHelper);
	
	const boxGeometry = new THREE.BoxGeometry();
	const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
	const box = new THREE.Mesh(boxGeometry, boxMaterial);
	scene.add(box);
	
	const planeGeometry = new THREE.PlaneGeometry(1000, 1000, 20, 20);
	const planeMaterial = new THREE.MeshStandardMaterial({ 
		color: 0x0000ff, side: THREE.DoubleSide, wireframe: true });
	plane = new THREE.Mesh(planeGeometry, planeMaterial);
	plane.rotation.x += -.5 * Math.PI;
	plane.visible = false;
	
	scene.add(plane);

	const sphereGeometry = new THREE.SphereGeometry(
		50, // radius 
		16, // widthSegments
		16, // heightSegments
	);
	const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
	sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
	scene.add(sphere);

	sphere.position.set(5, 15, 5);
	
	const gridHelper = new THREE.GridHelper(1000);
	scene.add(gridHelper);

	ambientLight = new THREE.AmbientLight(0xffffff);
	scene.add(ambientLight);
	console.log(ambientLight);
	console.log(ambientLight.intensity);
	
	pointLight = new THREE.PointLight();
	scene.add(pointLight);
	console.log(pointLight);
	console.log(pointLight.intensity);

	pointLightHelper = new THREE.PointLightHelper(pointLight, 10);
	scene.add(pointLightHelper);

	directionalLight = new THREE.DirectionalLight();
	scene.add(directionalLight);
	console.log(directionalLight);
	console.log(directionalLight.intensity);

	directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 100);
	scene.add(directionalLightHelper);

	/////

	const reliefMesh = new ReliefGrid(16, 16, 40);
    for (const vertex of reliefMesh.vertices) {
        const sx = Math.random() * 16 - 8;
        const sy = Math.random() * 16 - 8;
        const sz = Math.random() * 128 - 64;
        vertex.setShift([sx, sy, sz]);
    }
	
	const geometry = new THREE.BufferGeometry();

    const halfEdges = reliefMesh.halfEdges;
    const numberOfHalfEdges = halfEdges.length;
    
    const vertices = new Float32Array(numberOfHalfEdges * 3);
    
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

    geometry.computeVertexNormals();
        
    const material = new THREE.MeshStandardMaterial({ 
		color: 0x0000ff, 
        side: THREE.DoubleSide, 
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
    
	
}

function initGUI() {
	gui = new dat.GUI();
	guiOptions = {
		sphereColor: '#ff0000',
		spherePosition: 15,
		frothProgress: 0.0,
		frothWireframe: false,
		
		ambientLightIntensity: 2.0,
		ambientLightColor: '#ffffff',
		
		pointLightIntensity: 0,
		pointLightColor: '#ffffff',
		pointLightAzimuth: 360-127,
		pointLightAltitude: 45.0,
		pointLightDistance: 2000,
		pointLightHelper: false,
		
		directionalLightIntensity: 2,
		directionalLightColor: '#ffffff',
		directionalLightAzimuth: 360-45,
		directionalLightAltitude: 45.0,
		directionalLightDistance: 500,
		directionalLightHelper: false,
		
		cameraFOV: 2,
		cameraAzimuth: 45,
		cameraAltitude: 45.0,
		cameraDistance: 1000,
		cameraHelper: false,
	};

	const geometryGUI = gui.addFolder("Geometry");
	geometryGUI.addColor(guiOptions, 'sphereColor').onChange((e) => {
		sphere.material.color.set(e);
	    needsRedraw = true;
	});
	sphere.material.color.set(guiOptions.sphereColor);
	geometryGUI.add(guiOptions, 'spherePosition', -100, 100).onChange((e) => {
		sphere.position.y = e;
	    needsRedraw = true;
	});
	sphere.position.y = guiOptions.spherePosition;
	
	geometryGUI.add(guiOptions, 'frothWireframe').onChange((e) => {
		plane.material.wireframe = e;
	    needsRedraw = true;
	});
	plane.material.wireframe = guiOptions.frothWireframe;
	geometryGUI.add(guiOptions, 'frothProgress', 0, 1.0).onChange((e) => {
		// TODO;
		plane.position.y = e * 100;
	    needsRedraw = true;
	});
	plane.position.y = guiOptions.frothProgress * 100;
	
	const lightGUI = gui.addFolder("Light");

	const ambientLightGUI = lightGUI.addFolder("Ambient Light");
	ambientLightGUI.add(guiOptions, 'ambientLightIntensity', 0, 10).onChange((e) => {
		ambientLight.intensity = e;
	    needsRedraw = true;
	});
	ambientLight.intensity = guiOptions.ambientLightIntensity;
	ambientLightGUI.addColor(guiOptions, 'ambientLightColor').onChange((e) => {
		ambientLight.color.set(e);
	    needsRedraw = true;
	});
	ambientLight.color.set(guiOptions.ambientLightColor);

	const pointLightGUI = lightGUI.addFolder("Point Light");
	pointLightGUI.add(guiOptions, 'pointLightIntensity', 0, 2000000).onChange((e) => {
		pointLight.intensity = e;
	    needsRedraw = true;
	});
	pointLight.intensity = guiOptions.pointLightIntensity;
	pointLightGUI.addColor(guiOptions, 'pointLightColor').onChange((e) => {
		pointLight.color.set(e);
	    needsRedraw = true;
	});
	pointLight.color.set(guiOptions.pointLightColor);
	pointLightGUI.add(guiOptions, 'pointLightAzimuth', 0, 360).onChange((e) => {
		updatePointLightPosition();
	    needsRedraw = true;
	});
	pointLightGUI.add(guiOptions, 'pointLightAltitude', -180, 180).onChange((e) => {
		updatePointLightPosition();
	    needsRedraw = true;
	});
	pointLightGUI.add(guiOptions, 'pointLightDistance', 0, 2000).onChange((e) => {
		updatePointLightPosition();
	    needsRedraw = true;
	});
	updatePointLightPosition();
	pointLightGUI.add(guiOptions, 'pointLightHelper').onChange((e) => {
		pointLightHelper.visible = e;
	    needsRedraw = true;
	});
	pointLightHelper.visible = guiOptions.pointLightHelper;
	
	const directionalLightGUI = lightGUI.addFolder("Directional Light");
	directionalLightGUI.add(guiOptions, 'directionalLightIntensity', 0, 10).onChange((e) => {
		directionalLight.intensity = e;
	    needsRedraw = true;
	});
	directionalLight.intensity = guiOptions.directionalLightIntensity;
	directionalLightGUI.addColor(guiOptions, 'directionalLightColor').onChange((e) => {
		directionalLight.color.set(e);
	    needsRedraw = true;
	});
	directionalLight.color.set(guiOptions.directionalLightColor);
	directionalLightGUI.add(guiOptions, 'directionalLightAzimuth', 0, 360).onChange((e) => {
		updateDirectionalLightPosition();
	    needsRedraw = true;
	});
	directionalLightGUI.add(guiOptions, 'directionalLightAltitude', -180, 180).onChange((e) => {
		updateDirectionalLightPosition();
	    needsRedraw = true;
	});
	directionalLightGUI.add(guiOptions, 'directionalLightDistance', 0, 2000).onChange((e) => {
		updateDirectionalLightPosition();
	    needsRedraw = true;
	});
	updateDirectionalLightPosition();
	directionalLightGUI.add(guiOptions, 'directionalLightHelper').onChange((e) => {
		directionalLightHelper.visible = e;
	    needsRedraw = true;
	});
	directionalLightHelper.visible = guiOptions.directionalLightHelper;

	const cameraGUI = gui.addFolder("Camera");

	cameraGUI.add(guiOptions, 'cameraFOV', 0, 360).onChange((e) => {
		updateCameraFOV();
	    needsRedraw = true;
	});
	cameraGUI.add(guiOptions, 'cameraAzimuth', 0, 360).onChange((e) => {
		updateCameraPosition();
	    needsRedraw = true;
	});
	cameraGUI.add(guiOptions, 'cameraAltitude', -180, 180).onChange((e) => {
		updateCameraPosition();
	    needsRedraw = true;
	});
	cameraGUI.add(guiOptions, 'cameraDistance', 0, 2000).onChange((e) => {
		updateCameraPosition();
	    needsRedraw = true;
	});
	updateCameraPosition();
	cameraGUI.add(guiOptions, 'cameraHelper').onChange((e) => {
		cameraHelper.visible = e;
	    needsRedraw = true;
	});
	cameraHelper.visible = guiOptions.cameraHelper;

	needsRedraw = true;
}

export function main() {
	init3D();
	initGUI();
	window.requestAnimationFrame(animationFrame);
}

function updatePointLightPosition() {
	const azimuth = (guiOptions.pointLightAzimuth / 180) * Math.PI;
	const altitude = (guiOptions.pointLightAltitude / 180) * Math.PI;
	const distance = guiOptions.pointLightDistance;
	const y = Math.sin(altitude) * distance;
	const groundPlaneDistance = Math.cos(altitude) * distance;
	const z = Math.sin(azimuth) * groundPlaneDistance;
	const x = Math.cos(azimuth) * groundPlaneDistance;
	pointLight.position.set(x, y, z);
}

function updateDirectionalLightPosition() {
	const azimuth = (guiOptions.directionalLightAzimuth / 180) * Math.PI;
	const altitude = (guiOptions.directionalLightAltitude / 180) * Math.PI;
	const distance = guiOptions.directionalLightDistance;
	const y = Math.sin(altitude) * distance;
	const groundPlaneDistance = Math.cos(altitude) * distance;
	const z = Math.sin(azimuth) * groundPlaneDistance;
	const x = Math.cos(azimuth) * groundPlaneDistance;
	directionalLight.position.set(x, y, z);
	directionalLightHelper.update();
	//directionalLight.lookAt(0, 0, 0);
}

function updateCameraPosition() {
	const azimuth = (guiOptions.cameraAzimuth / 180) * Math.PI;
	const altitude = (guiOptions.cameraAltitude / 180) * Math.PI;
	const distance = guiOptions.cameraDistance;
	const y = Math.sin(altitude) * distance;
	const groundPlaneDistance = Math.cos(altitude) * distance;
	const z = Math.sin(azimuth) * groundPlaneDistance;
	const x = Math.cos(azimuth) * groundPlaneDistance;
	camera.position.set(x, y, z);
	camera.lookAt(0, 0, 0);
	camera.updateProjectionMatrix();
	orbitControls.update();
	cameraHelper.update();
}