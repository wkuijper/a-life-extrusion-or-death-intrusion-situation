import { CavernGrid, HalfFace, Tetrahedron } from "./cavern.js";

import * as THREE from "./three.module.js";

class Net {

    _reportNewNetMesh(netMesh) {
        this.__netMeshes.push(netMesh);
    }
    
    _reportNewNetFace(netFace) {
        this.__netFaceMap(netFaceMap.halfFace, netFace);
    }

    _reportNewNetHalfEdge(netHalfEdge) {
        this.__netHalfEdgeMap(netFaceMap.halfFace, netFace);
    }
    
    constructor(initialTetrahedronsAndHalfFaces) {
        this.__animationSteps = [];
        this.__currentAnimationStep = null;
        this.__totalTime = 0;

        this.__finished = false;

        this.__netMeshes = [];
        this.__netFaceMap = new Map();
        this.__netHalfEdgeMap = new Map();
        
        this.__currHalfFaceColor = new Map();
        this.__currHalfEdgeTranslation = new Map();
    }

    animationStep(time) {
        const animationStep = new AnimationStep(this, this.__animationSteps.length, this.__currentAnimationStep, time)
        this.__animationSteps.push(animationStep);
        this.__currentAnimationStep = animationStep;
        this.__totalTime += time;
        return animationStep;
    }

    finish() {
        
        this.__finished = true;
    }
}

class _NetMesh {

    _reportNewNetFace(netFace) {
        netFace._index = this.__netFaceIndex;
        this.__netFaces[this.__netFaceIndex] = netFace;
        this.__netFaceIndex++;
        this.__net._reportNewNetFace(netFace);
    }
    
    _reportNewNetHalfEdge(netHalfEdge) {
        netFace._index = this.__netFaceIndex;
        this.__netFaces[this.__netFaceIndex] = netFace;
        this.__netFaceIndex++;
        this.__net._reportNewNetHalfEdge(netHalfEdge);
    }
    
    constructor(net, halfFaceSet) {
        this.__halfFaceSet = halfFaceSet;
        faceIndex = 0;
        this.__netFaceIndex = 0;
        this.__netFaces = new Array(halfFaceSet.size);

        let totX = 0;
        let totY = 0;
        let totZ = 0;
        let totCount = 0;
        
        for (const halfFace of halfFaceSet) {
            for (const halfEdge of halfFace) {
                const sourceVertex = halfEdge.sourceVertex;
                totX += sourceVertex.x;
                totY += sourceVertex.y;
                totZ += sourceVertex.z;
                totCount++;
            }
        }

        const posX = totCount === 0 ? 0 : totX / totCount;
        const posY = totCount === 0 ? 0 : totY / totCount;
        const posZ = totCount === 0 ? 0 : totZ / totCount;
        
        this.__posX = posX;
        this.__posY = posY;
        this.__posZ = posZ;

        this.__rotA = 1;
        this.__rotB = 0;
        this.__rotC = 0;
        this.__rotD = 0;
        this.__rotE = 1;
        this.__rotF = 0;
        this.__rotG = 0;
        this.__rotH = 0;
        this.__rotI = 1;
        
        for (const halfFace of halfFaceSet) {
            const netFace = new _NetFace(netMesh, halfFace);
        }
        
        net._reportNewNetMesh(this);
    }
    
}

class _NetFace {

    constructor(netMesh, halfFace) {
        this.__netMesh = netMesh;
        this._index = -1;
        this.__halfFace = halfFace;
        const [he1, he2, he3] = halfFace.halfEdges();
        this.__netHalfEdge1 = new _NetHalfEdge(net, this, he1);
        this.__netHalfEdge2 = new _NetHalfEdge(net, this, he2);
        this.__netHalfEdge3 = new _NetHalfEdge(net, this, he3);
        netMesh._reportNetFace(this);
    }
    
}

class _NetHalfEdge {

    constructor(net, netFace, halfEdge) {
        this.__netFace = netFace;
        this._index = -1;
        this.__halfEdge = halfEdge;
        const sourceVertex = halfEdge.sourceVertex;
        const absX = sourceVertex.x;
        this.__absX = absX;
        this.__relX = netFace.
        this.__absY = sourceVertex.y;
        this.__absZ = sourceVertex.z;
        this.__relX = ;
        net._reportNetHalfEdge(this);
    }

    absPositionAsVec3() {
        return [this.__x, this.__y, this.__z];
    }

    relPositionAsVec3() {
        return [this.__x, this.__y, this.__z];
    }
}

class AnimationStep {

    constructor(parentNet, index, previousStep) {
        this.__parentNet = parentNet;
        this.__index = index;
        this.__previousStep = previousStep;
        this._nextStep = null;
        
        if (previousStep !== null) {
            previousStep._nextStep = this;
        }
        
        this.__changes = [];
        this.__changedHalfFaces = new Map();
    }
    
    color(tetrahedronsAndHalfFaces, color) {
        const coloring = new Coloring(this, this.__changes.length, tetrahedronsAndHalfFaces, color);
        this._treatNewChange(coloring);
        return this;
    }

    unfold(tetrahedronsAndHalfFaces, halfEdge, angle) {
        const unfolding = new Unfolding(this, this.__changes.length, tetrahedronsAndHalfFaces, halfEdge, angle);
        this._treatNewChange(unfolding);
        return this;       
    }

    explode(tetrahedronsAndHalfFaces, halfFace, distance) {
        const explosion = new Explosion(this, this.__changes.length, tetrahedronsAndHalfFaces, halfFace, distance);
        this._treatNewChange(explosion);
        return this;   
    }

    lay(tetrahedronsAndHalfFaces, absolutePlaneOriginVec3, referenceHalfEdge, targetReferencePositionVec2, targetReferenceOrientationVec2) {
        const laying = new Laying(this, this.__changes.length, tetrahedronsAndHalfFaces, absolutePlaneOriginVec3, referenceHalfEdge, targetReferencePositionVec2, targetReferenceOrientationVec2);
        this._treatNewChange(laying);
        return this;     
    }

    nextStep(time) {
        return this.__net.animationStep(time);
    }
    
    _treatNewChange(change) {
        this.__changes.push(change);
        const changedHalfFaces = this.__changedHalfFaces;
        for (const halfFace of change.allHalfFaces()) {
            if (changedHalfFaces.has(halfFace)) {
                throw new Error(`HalfFace has more than one change applied to it during single AnimationStep`);
            }
            changedHalfFaces.set(halfFace, change);
        }
    }
}

class NetChange {

    get id() {
        return this.__id;
    }

    allHalfFaces() {
        return this.__halfFaceSet.values();
    }
    
    constructor(id, tetrahedronsAndHalfFaces) {
        this.__id = id;
        this.__tetrahedronsAndFaces = tetrahedronsAndHalfFaces;
        const tetrahedronSet = new Set();
        const halfFaceSet = new Set();
        for (const tetrahedronOrHalfFace of tetrahedronsAndHalfFaces) {
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
    }
}

class Coloring extends NetChange {

    constructor(id, tetrahedronsAndHalfFaces, color) {
        super(id, tetrahedronsAndHalfFaces);
        this.__color = color;
    }
    
}

class Explosion extends NetChange {

    constructor(id, halfFace, distance) {
        super(id);
        this.__halfFace = halfFace;
        this.__distance = distance;
    }
    
}

class Laying extends NetChange {

    constructor(id, halfFace, halfEdgeInHalfFace, plane, locationOfSourceVertexInPlane, directionOfHalfEdgeInPlane) {
        super(id);
        this.__halfFace = halfFace;
        this.__halfEdgeInHalfFace = halfEdgeInHalfFace;
        this.__plane = plane;
        
    }
    
}

class NetNode {

    constructor(parentNode, tetrahedronsAndHalfFaces) {
        this.__parentNode = parentNode;
        const tetrahedronSet = new Set();
        const halfFaceSet = new Set();
        for (const tetrahedronOrHalfFace of tetrahedronsAndHalfFaces) {
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
}
    
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