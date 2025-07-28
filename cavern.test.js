import { CavernGrid, HalfFace, Tetrahedron } from "./cavern.js";

import * as THREE from "./three.module.js";

class Net {
    
    _getOrCreateNetFace(halfFace) {
        if (!this.__halfFaceToNetFaceMap.has(halfFace)) {
            const netFace = new NetFace(net, this.__netFaces.length, halfFace);
            const [he1, he2, he3] = halfFace.halfEdges();
            const [nv1, nv2, nv3] = 
                [he1, he2, he3].map((he) => this._getOrCreateNetVertex(he));
            netFace._netVertex1 = nv1;
            netFace._netVertex2 = nv2;
            netFace._netVertex3 = nv3;
            nv1._netFace = netFace;
            nv2._netFace = netFace;
            nv3._netFace = netFace;
            this.__netFaces.push(netFace);
            this.__halfFaceToNetFaceMap.set(halfFace, netFace);
        }
        return this.__halfFaceToNetFaceMap.get(halfFace);
    }

    _getOrCreateNetVertex(halfEdge) {
        if (!this.__halfEdgeToNetVertexMap.has(halfEdge)) {
            const netVertex = new NetVertex(net, this.__netVertices.length, halfEdge);
            this.__netVertices.push(netVertex);
            this.__halfEdgeToNetVertexMap.set(halfEdge, netVertex);
        }
        return this.__halfEdgeToNetVertexMap.get(halfEdge);
    }
    
    constructor() {
        this.__animationSteps = [];
        this.__currentAnimationStep = null;
        
        this.__totalAnimationTime = 0;

        this.__compiled = false;

        this.__netFaces = [];
        this.__netVertices = [];
        
        this.__halfFaceToNetFaceMap = new Map();
        this.__halfEdgeToNetVertexMap = new Map();
        
        this.__animationStates = null;

        this.__mesh = null;
    }

    animationStep(time) {
        const animationStep = new AnimationStep(this, this.__animationSteps.length, this.__currentAnimationStep, time)
        this.__animationSteps.push(animationStep);
        this.__currentAnimationStep = animationStep;
        this.__totalAnimationTime += time;
        return animationStep;
    }

    compile() {
        if (this.__compiled) {
            throw new Error(`invariant violation`);
        }
        
        const animationSteps = this.__animationSteps;
        const numberOfAnimationSteps = animationSteps.length;
        
        const animationStates = new Array(numberOfAnimationSteps + 1);

        const netVertices = this.__netVertices;
        const numberOfVertices = netVertices.length;

        const netFaces = this.__netFaces;
        const numberOfFaces = netFaces.length;
        
        const initialState = new _NetState(this, numberOfVertices, numberOfFaces);

        const initialColors = initialState._colors;
        const initialVisible = initialState._visible;
        for (let i = 0; i < numberOfFaces; i++) {
            initialColors[i] = [0.5, 0.5, 0.5];
            initialVisible[i] = true;
        }

        const initialPositions = initialState._positions;
        for (let i = 0; i < numberOfFaces; i++) {
            const netVertex = netVertices[i];
            initialPositions[i] = netVertex.halfEdge.sourceVertex.position();
        }

        animationStates[0] = initialState;
        
        this.__compiled = true;
        this.__animationStates = animationStates;

        let firstRelevantAnimationStep = null;
        let firstRelevantAnimationState = animationStates[0];
        for (let i = 0; i < numberOfAnimationSteps; i++) {
            const animationStep = animationSteps[i];
            const fromState = animationStates[i];
            const toState = new _NetState(this, numberOfVertices, numberOfFaces);
            if (firstRelevantAnimationStep === null && animationStep.duration > 0) {
                firstRelevantAnimationStep = animationStep;
                firstRelevantAnimationState = fromState;
            }
            animationStep._compile(fromState, toState);
        }
        this.__firstRelevantAnimationStep = firstRelevantAnimationStep;
        this.__firstRelevantAnimationState = firstRelevantAnimationState;
        this.__lastAnimationState = animationStates[numberOfAnimationSteps];
        
        const currAnimationState = new _NetState(this, numberOfVertices, numberOfFaces);
        currAnimationState.copyFrom(firstRelevantAnimationState);
        
        this.__currAnimationStep = firstRelevantAnimationStep;
        this.__currAnimationState = currAnimationState;
        
        this.__currAnimationTime = 0.0;
        this.__currAnimationStepTime = 0.0;

        this.__initializeMesh();
    }

    advance(timeStep) {
        let animationStepTime = this.__currAnimationStepTime + timeStep;
        let animationStep = this.__currAnimationStep;
        while (animationStep !== null && animationStep.time <= animationStepTime) {
            animationStepTime -= animationStep.time;
            animationStep = animationStep.nextStep;
        }
        const animationTime = this.__currentAnimationTime + timeStep;
        if (animationStep === null 
            || animationTime > this.__totalAnimationTime /* defensive */ ) {
            this.__currAnimationTime = this.__totalAnimationTime;
            this.__currAnimationState.copyFrom(this.__lastAnimationState);
            this.__actualizeCurrAnimationState();
            return false;
        }
        const index = animationStep.index;
        const fromState = animationStates[index];
        const toState = animationStates[index+1];
        const animationStates = this.__animationStates;
        animationStep._interpolate( 
            animationStepTime, 
            this.__currAnimationState,
        );
        this.__currAnimationTime = animationTime;
        this.__currAnimationStepTime = animationStepTime;
        this.__actualizeCurrAnimationState();
        return true;
    }
    
    reset() {
        this.__currentAnimationTime = 0;
        this.__currAnimationStep = this.__firstRelevantAnimationStep;
        this.__currAnimationState.copyFrom(this.__firstRelevantAnimationState);
        this.__currentAnimationStepTime = 0;
    }
    
    scrub(time) {
        this.reset();
        this.advance(time);
    }

    __initializeMesh() {
        const bufferGeometry = new THREE.BufferGeometry();
        const numberOfVertices = this.__numberOfVertices;
        const bufferGeometryPositionArray = new Float32Array(2 * numberOfVertices * 3);
        const numberOfFaces = this.__numberOfFaces;
        const bufferGeometryColorArray = new Float32Array(2 * numberOfFaces * 3);

        const indices = [];

        // front winding-order
        for (let i = 0; i < numberOfFaces; i++) {
            const vertexOffset = i * 3;
            indices.push(vertexOffset, vertexOffset + 1, vertexOffset + 2);
        }

        // back winding order
        for (let i = 0; i < numberOfFaces; i++) {
            const vertexOffset = i * 3;
            indices.push(vertexOffset + 2, vertexOffset + 1, vertexOffset);
        }
        
        bufferGeometry.setIndex(indices);
        
        bufferGeometry.setAttribute('position',
                                    new THREE.BufferAttribute(
                                        bufferGeometryPositionArray, 3));
        
        bufferGeometry.setAttribute('color', 
                                    new THREE.Float32BufferAttribute(
                                        bufferGeometryColorArray, 3));
        
        this.__actualizeCurrAnimationState();
    }

    __actualizeCurrAnimationState() {
        const bufferGeometry = this.__bufferGeometry;
        const numberOfVertices = this.__numberOfVertices;
        const bufferGeometryPositionArray = this.__bufferGeometryPositionArray;
        const numberOfFaces = this.__numberOfFaces;
        const bufferGeometryColorArray = this.__bufferGeometryColorArray;

        const currAnimationState = this.__currAnimationState;
        
        const netFaceVisible = currAnimationState._faceVisible;
        const netVertexPositions = currAnimationState._vertexPositions;
        const netFrontFaceColors = currAnimationState._frontFaceColors;
        const netBackFaceColors = currAnimationState._backFaceColors;

        // update position and color (and handle invisible faces by projecting them away)
        let bufferGeometryIndex = 0;
        let bufferGeometryBacksideIndex = numberOfFaces * 3 * 3;
        let netVertexIndex = 0;
        const farFarAway = 1e30;
        for (let i = 0; i < numberOfFaces; i++) {
            const netFaceIndex = i;
            if (!netFaceVisible[netFaceIndex]) {
                // three vertex positions per face and three colors per half-face
                for (let j = 0; j < 3; j++) {
                    bufferGeometryPositionArray[bufferGeometryIndex] = farFarAway;
                    bufferGeometryColorArray[bufferGeometryIndex] = 0.0;
                    bufferGeometryColorArray[bufferGeometryBackIndex] = 0.0;
                    bufferGeometryIndex++;
                    bufferGeometryBacksideIndex++;
                    bufferGeometryPositionArray[bufferGeometryIndex] = farFarAway;
                    bufferGeometryColorArray[bufferGeometryIndex] = 0.0;
                    bufferGeometryColorArray[bufferGeometryBackIndex] = 0.0;
                    bufferGeometryIndex++;
                    bufferGeometryBacksideIndex++;
                    bufferGeometryPositionArray[bufferGeometryIndex] = farFarAway;
                    bufferGeometryColorArray[bufferGeometryIndex] = 0.0;
                    bufferGeometryColorArray[bufferGeometryBackIndex] = 0.0;
                    bufferGeometryIndex++;
                    bufferGeometryBacksideIndex++;
                }
            } else {
                // three vertex positions per face and three colors per half-face
                const [fr, fg, fb] = netFrontFaceColors[netFaceIndex];
                const [br, bg, bb] = netBackFaceColors[netFaceIndex];
                for (let j = 0; j < 3; j++) {
                    const [x, y, z] = netVertexPositions[netVertexIndex];
                    netVertexIndex++;
                    bufferGeometryPositionArray[bufferGeometryIndex] = x;
                    bufferGeometryColorArray[bufferGeometryIndex] = fr;
                    bufferGeometryColorArray[bufferGeometryBackIndex] = br;
                    bufferGeometryIndex++;
                    bufferGeometryBacksideIndex++;
                    bufferGeometryPositionArray[bufferGeometryIndex] = y;
                    bufferGeometryColorArray[bufferGeometryIndex] = fg;
                    bufferGeometryColorArray[bufferGeometryBackIndex] = bg;
                    bufferGeometryIndex++;
                    bufferGeometryBacksideIndex++;
                    bufferGeometryPositionArray[bufferGeometryIndex] = z;
                    bufferGeometryColorArray[bufferGeometryIndex] = fb;
                    bufferGeometryColorArray[bufferGeometryBackIndex] = bb;
                    bufferGeometryIndex++;
                    bufferGeometryBacksideIndex++;
                }
            }
        }
        
        bufferGeometry.attributes.position.needsUpdate = true;
        bufferGeometry.attributes.color.needsUpdate = true;
    }
}

class _NetState {

    constructor(net, numberOfVertices, numberOfFaces) {
        this.__numberOfVertices = numberOfVertices;
        this.__numberOfFaces = numberOfFaces;
        this._vertexPositions = new Array(numberOfVertices);
        this._frontFaceColors = new Array(numberOfFaces);
        this._backFaceColors = new Array(numberOfFaces);
        this._faceVisible = new Array(numberOfFaces);
    }

    copyFrom(other) {
        const thisVertexPositions = this._vertexPositions;
        const thisFrontFaceColors = this._frontFaceColors;
        const thisBackFaceColors = this._backFaceColors;
        const thisFaceVisible = this._faceVisible;
        const otherVertexPositions = other._vertexPositions;
        const otherFrontFaceColors = other._frontFaceColors;
        const otherBackFaceColors = other._backFaceColors;
        const otherFaceVisible = other._faceVisible;
        const numberOfVertices = this.__numberOfVertices;
        for (let i = 0; i < numberOfVertices; i++) {
            thisVertexPositions[i] = otherVertexPositions[i];
        }
        const numberOfFaces = this.__numberOfFaces;
        for (let i = 0; i < numberOfFaces; i++) {
            thisFrontFaceColors[i] = otherFrontFaceColors[i];
            thisBackFaceColors[i] = otherBackFaceColors[i];
            thisFaceVisible[i] = otherFaceVisible[i];
        }
    }
}

class _NetFace {

    get index() {
        return this.__index;
    }

    get netVertex1() {
        return this._netVertex1;
    }
    
    get netVertex2() {
        return this._netVertex2;
    }
    
    get netVertex3() {
        return this._netVertex3;
    }

    *netVertices() {
         yield this.netVertex1;
         yield this.netVertex2;
         yield this.netVertex3;   
    }
    
    constructor(net, index, halfFace) {
        this.__net = net;
        this.__index = index;
        this.__halfFace = halfFace;
        this._netVertex1 = null;
        this._netVertex2 = null;
        this._netVertex3 = null;
    }
    
}

class _NetVertex {

    get index() {
        return this.__index;
    }
    
    constructor(net, index, halfEdge) {
        this.__net = net;
        this.__index = index;
        this.__halfEdge = halfEdge;
        this._netFace = null;
    }
    
}

class AnimationStep {

    get net() {
        return this.__net;
    }
    
    get nextStep() {
        return this._nextStep;
    }
    
    get previousStep() {
        return this.__previousStep;
    }
    
    constructor(net, index, previousStep) {
        this.__net = net;
        this.__index = index;
        this.__previousStep = previousStep;
        this._nextStep = null;
        
        if (previousStep !== null) {
            previousStep._nextStep = this;
        }
        
        this.__changes = [];
        this.__changedNetFaces = new Map();

        this.__fromState = null;
        this.__toState = null;
        this.__compiled = false;
    }
    
    color(primitives, frontColor, backColor) {
        const coloring = new Coloring(this, this.__changes.length, primitives, frontColor, backColor);
        this._treatNewChange(coloring);
        return this;
    }

    unfold(primitives, halfEdge, angle) {
        const unfolding = new Unfolding(this, this.__changes.length, primitives, halfEdge, angle);
        this._treatNewChange(unfolding);
        return this;       
    }

    explode(primitives, halfFace, distance) {
        const explosion = new Explosion(this, this.__changes.length, primitives, halfFace, distance);
        this._treatNewChange(explosion);
        return this;   
    }

    lay(primitives, absolutePlaneOriginVec3, referenceHalfEdge, targetReferencePositionVec2, targetReferenceOrientationVec2) {
        const laying = new Laying(this, this.__changes.length, primitives, absolutePlaneOriginVec3, referenceHalfEdge, targetReferencePositionVec2, targetReferenceOrientationVec2);
        this._treatNewChange(laying);
        return this;     
    }
    
    _treatNewChange(change) {
        this.__changes.push(change);
        const changedNetFaces = this.__changedNetFaces;
        for (const netFace of change.netFaces()) {
            if (changedNetFaces.has(netFace)) {
                throw new Error(`NetFace has more than one change applied to it during single AnimationStep`);
            }
            changedNetFaces.set(netFace, change);
        }
    }

    _compile(fromState, toState) {
        if (this.__compiled) {
            throw new Error(`invariant violation: compile called more than once`);
        }
        this.__fromState = fromState;
        this.__toState = toState;
        for (const change of this.__changes) {
            change._compile(fromState, toState);
        }
        this.__compiled = true;
    }

    _interpolate(atStepTime, betweenState) {
        if (!this.__compiled) {
            throw new Error(`invariant violation: interpolate called on uncompiled AnimationStep`);
        }
        for (const change of this.__changes) {
            change._interpolate(betweenState, atStepTime);
        }
    }
}

class NetChange {

    get animationStep() {
        return this.__animationStep;
    }
    
    get id() {
        return this.__id;
    }

    netFaces() {
        return this.__netFaceSet.values();
    }

    netVertices() {
        return this.__netVertexSet.values();
    }
    
    constructor(animationStep, id, primitives) {
        this.__animationStep = animationStep;
        this.__id = id;
        this.__primitives = primitives;
        const tetrahedronSet = new Set();
        const halfFaceSet = new Set();
        for (const tetrahedronOrHalfFace of primitives) {
            if (tetrahedronOrHalfFace instanceof HalfFace) {
                halfFaceSet.add(tetrahedronOrHalfFace);
            } else if (tetrahedronOrHalfFace instanceof Tetrahedron) {
                tetrahedronSet.add(tetrahedronOrHalfFace);
            } else {
                throw new Error(`object is neither Tetrahedron nor HalfFace`);
            }
        }
        for (const tetrahedron of tetrahedronSet) {
             for (const halfFace of tetrahedron.halfFaces()) {
                 halfFaceSet.add(halfFace);
             }   
        }
        this.__tetrahedronSet = tetrahedronSet;
        this.__halfFaceSet = halfFaceSet;
        
        const net = animationStep.net;
        
        const netFaceSet = new Set();
        for (const halfFace of this halfFaceSet) {
            const netFace = net._getOrCreateNetFace(halfFace);
            netFaceSet.add(netFace);
        }
        this.__netFaceSet = netFaceSet;

        const netVertexSet = new Set();
        for (const netFace of netFaceSet) {
            for (const netVertex of netFace.netVertices()) {
                netVertexSet.add(netVertex);
            }
        }
        this.__netVertexSet = netVertexSet;   

        this.__compiled = false;
    }

    _compile(fromState, toState) {
        if (this.__compiled) {
            throw new Error(`invariant violation: compile called more than once`);
        }
        this.__compile(fromState, toState);
        this.__compiled = true;
    }

    _interpolate(stepTime, progressRatio, betweenState) {}
        if (!this.__compiled) {
            throw new Error(`invariant violation: interpolation called before compile`);
        }
        this.__interpolate(stepTime, progressRatio, betweenState);
    }
}

class Coloring extends NetChange {

    constructor(animationStep, id, primitives, frontColor, backColor) {
        super(animationStep, id, primitives);
        this.__frontColor = frontColor;
        this.__backColor = backColor;
        this.__fromState = null;
    }

    __compile(fromState, toState) {
        for (const netFace of this.netFaces()) {
            toState._setNetFaceColors(netFace, this.__frontColor, this.__backColor);
        }
    }
    
    __interpolate(stepTime, progressRatio, betweenState) {
        const fromState = this.__fromState;
        const oneMinusProgressRatio = 1 - progressRatio;
        for (const netFace of this.netFaces()) {
            const [fromFrontColor, fromBackColor] = fromState._getNetFaceColors(netFace);
            const [toFrontColor, toBackColor] = [this.__frontColor, this.__backColor]; // === toState._getNetFaceColors(netFace);
            const frontColor = addV3(scaleV3(oneMinusProgressRatio, fromFrontColor),
                                    scaleV3(progressRatio, toFrontColor));
            const backColor = addV3(scaleV3(oneMinusProgressRatio, fromBackColor),
                                    scaleV3(progressRatio, toBackColor));
            betweenState._setNetFaceColors(netFace, frontColor, backColor);
        }
    }
}

class Explosion extends NetChange {

    constructor(animationStep, id, primitives, halfFace, distance) {
        super(animationStep, id, primitives);
        this.__netFace = animationStep.net._getOrCreateNetFace(halfFace);
        this.__distance = distance;
        this.__fromState = null;
        this.__toState = null;
    }

    __compile(fromState, toState) {
        this.__fromState = fromState;
        this.__toState = toState;
        
        const netFace = this.__netFace;
        const netVertex1 = netFace.netVertex1;
        const netVertex2 = netFace.netVertex1;
        const netVertex3 = netFace.netVertex1; 
        
        const p1 = fromState._getNetVertexPosition(netVertex1);
        const p2 = fromState._getNetVertexPosition(netVertex2);
        const p3 = fromState._getNetVertexPosition(netVertex3);

        const v12 = subtractV3(p2, p1);
        const v13 = subtractV3(p3, p1);

        const direction = normalizeV3(crossV3(v12, v13));

        if (direction === null) {
            throw new Error(`invariant violation: can't create normal for degenerate face`);
        }

        const translation = scaleV3(distance, direction);
        
        for (const netVertex of this.netVertices()) {
            const sourcePosition = fromState._getNetVertexPosition(netVertex);
            const targetPosition = addV3(sourcePosition, translation);
            toState._setNetVertexPosition(netVertex, targetPosition);
        }
    }
    
    __interpolate(stepTime, progressRatio, betweenState) {
        const oneMinusProgressRatio = 1 - progressRatio;
        for (const netVertex of this.netVertices()) {
            const sourcePosition = fromState._getNetVertexPosition(netVertex);
            const targetPosition = toState._getNetVertexPosition(netVertex);
            const betweenPosition = 
                addV3(scaleV3(oneMinusProgressRatio, sourcePosition),
                     scaleV3(progressRatio, targetPosition));
            betweenState._setNetVertexPosition(netVertex, betweenPosition);
        }
    }
}

class Folding extends NetChange {

    constructor(animationStep, id, primitives, halfEdge, angle) {
        super(animationStep, id, primitives);
        this.__sourceNetVertex = animationStep.net._getOrCreateNetVertex(halfEdge);
        this.__targetNetVertex = animationStep.net._getOrCreateNetVertex(halfEdge.nextHalfEdge);
        this.__angle = angle;
        this.__fromState = null;
        this.__axis = null;
    }

    __rotate(angle, targetState) {
        const fromState = this.__fromState;
        const axis = this.__axis;
        
        const rotationQuaternion = rotationQuaternionForAxisAngle(axis, angle);

        const rotationMatrix = rotationMatrixForQuaternion(rotationQuaternion);
            
        const affineRotationPostTranslationMatrix = 
            composeAffineM3V3(rotationMatrix, p0);

        const affinePreTranslationMatrix = 
            composeAffineM3V3(identityM3(), negV3(p0));

        // TODO: determine if we need premultiply instead here:
        const finalMatrix = 
            multM4(affinePreTranslationMatrix, affineRotationPostTranslationMatrix);
        
        for (const netVertex of this.netVertices()) {
            const sourcePosition = fromState._getNetVertexPosition(netVertex);
            const targetPosition = applyM4V3(finalMatrix, sourcePosition);
            targetState._setNetVertexPosition(netVertex, targetPosition);
        }
    }
    
    __compile(fromState, toState) {
        this.__fromState = fromState;
        const sourceNetVertex = this.__sourceNetVertex;
        const targetNetVertex = this.__targetNetVertex;
        const p0 = fromState._getNetVertexPosition(sourceNetVertex);
        const p1 = fromState._getNetVertexPosition(targetNetVertex);
        const dV = subtractV3(p1, p0);
        const axis = normalizeV3(dV);
        
        if (axis === null) {
            throw new Error(`invariant violation: can't create normalized axis for degenerate halfedge`);
        }

        this.__axis = axis;
        
        const angle = this.__angle;
        this.__rotate(angle, toState);
    }
    
    __interpolate(stepTime, progressRatio, betweenState) {
        const angle = this.__angle * progressRatio;
        this.__rotate(angle, betweenState);
    }
}

class Laying extends NetChange {

    constructor(animationStep, id, 
                halfEdge, 
                targetPositionV3,
                targetOrientationQ) {
        super(animationStep, id, primitives);
        
        const net = animationStep.net;

        const he1 = halfEdgeInHalfFace;
        const he2 = he1.nextHalfEdge;
        const he3 = he2.nextHalfEdge;
        
        const netVertex1 = net._getOrCreateNetVertex(he1);
        const netVertex2 = net._getOrCreateNetVertex(he2);
        const netVertex3 = net._getOrCreateNetVertex(he3);

        this.__targetPositionV3 = targetPositionV3;
        this.__targetOrientationQ = targetOrientationQ;
        
        this.__fromState = null;
        this.__sourcePositionV3 = null;
        this.__sourceOrientationQ = null;
    }

    __compile(fromState, toState) {
        this.__fromState = fromState;

        const pos1 = fromState._getNetVertexPosition(this._netVertex1);
        const pos2 = fromState._getNetVertexPosition(this._netVertex2);
        const pos3 = fromState._getNetVertexPosition(this._netVertex3);
        
        this.__sourcePositionV3 = pos1;

        const vec12 = subtractV3(pos2, pos1);
        const vec13 = subtractV3(pos3, pos1);

        const axisA = normalizeV3(vec13);
        const axisB = normalizeV3(crossV3(vec12, vec13));
        const axisC = normalizeV3(crossV3(axisA, axisB));

        const sourceOrientationMatrix = 
            rotationMatrixFromVectors(axisA, axisB, axisC);

        const sourceOrientationQ = 
              quaternionForRotationMatrix(sourceOrientationMatrix);
        this.__sourceOrientationQ = sourceOrientationQ;

        const targetOrientationQ = this.__targetOrientationQ;        
        
        const rotationQ = 
            multiplyQuaternions(
                targetOrientationQ,
                conjugateQuaternion(sourceOrientationQ);

        this.__rotationQ = rotationQ;

        // TODO: make rotation matrix
        // TODO: make affine matrix
        // TODO: apply affine matrix
    }
}

/*class NetNode {

    constructor(parentNode, primitives) {
        this.__parentNode = parentNode;
        const tetrahedronSet = new Set();
        const halfFaceSet = new Set();
        for (const tetrahedronOrHalfFace of primitives) {
            if (tetrahedronOrHalfFace instanceof HalfFace) {
                halfFaceSet.add(tetrahedronOrHalfFace);
            } else if (tetrahedronOrHalfFace instanceof Tetrahedron) {
                tetrahedronSet.add(tetrahedronOrHalfFace);
            } else {
                throw new Error(`object is neither Tetrahedron nor HalfFace`);
            }
        }
        for (const tetrahedron of tetrahedronSet) {
             for (const halfFace of tetrahedron.halfFaces()) {
                 halfFaceSet.add(halfFace);
             }   
        }
        this.__tetrahedronSet = tetrahedronSet;
        this.__halfFaceSet = halfFaceSet;
        this.__colorMap = new Map();
        this.__unfoldingList = [];
        this.__transform
        this.__halfFaceColorMap = new Map();
        this.__halfFaceUnfoldingMap = new Map();
    }

    colorHalfFaces(halfFaces, color) {
        if (!this.__colorMap.has(color)) {
            this.__color.set(color, new Set());
        }
        const coloredHalfFaceSet = this.__colorMap.get(color);
        for (const halfFace of halfFaces) {
            coloredHalfFaceSet.add(halfFace);
        }
    }

    unfoldHalfFaces(halfFaces, halfEdge, angleInRadians) {
            
    }

    _analyseOcclusions() {
        const occludedHalfFaceSet = new Set();
        for (const halfFace of halfFaceSet) {
            const oppositeHalfFace = halfFace.oppositeHalfFace;
            if (oppositeHalfFace === null) {
                continue;
            }
            const oppositeTetrahedron = oppositeHalfFace.tetrahedron;
            if (tetrahedronSet.had(oppositeTetrahedron)) {
                occludedHalfFaceSet.add(halfFace);
            }
        }
        const visibleHalfFaceSet = new Set();
        for (const halfFace of halfFaceSet) {
                if (!occludedHalfFaceSet.has(halfFace)) {
                visibleHalfFaceSet.add(halfFace);
            }
        }
        // TODO
    }
}*/
    
export function test(report) {
    report.startSection("test1", "Test 1: Single Gem Mesh", "");
    test1(report);
    report.endSection("test1");
	
	report.expandPath("/test1/dump");
}

export function test1(report) {
    const outputLine = report.outputLine;
    const prefix = "";
    const cavernGrid = new CavernGrid(1, 1, 1);
	const gem = cavernGrid.gems[0];
    
    report.startSection("dump", "Dump");
    cavernGrid._dump(outputLine, prefix);
    report.endSection("dump");
}