class CavernGrid {

    /*_reportNewVertex(vertex) {
        this.__vertices[this.__vertexIndex] = vertex;
        vertex._index = this.__vertexIndex;
        this.__vertexIndex++;
    }*/

    vertices() {
        return this.__vertices.values();
    }

    vertexAt(index) {
        return this.__vertices[index];
    }
    
    /*_reportNewGem(gem) {
        this.__gems[this.__gemIndex] = gem;
        gem._index = this.__gemIndex;
        this.__gemIndex++;
    }*/

    gems() {
        return this.__gems.values();
    }

    gemAt(index) {
        return this.__gems[index];
    }
    
    _reportNewHalfShard(halfShard) {
        this.__halfShards[this.__halfShardIndex] = halfShard;
        halfShard._index = this.__halfShardIndex;
        this.__halfShardIndex++;
    }

    halfShards() {
        return this.__halfShards.values();
    }

    halfShardAt(index) {
        return this.__halfShards[index];
    }
    
    _reportNewTetrahedron(tetrahedron) {
        this.__tetrahedrons[this.__tetrahedronIndex] = tetrahedron;
        tetrahedron._index = this.__tetrahedronIndex;
        this.__tetrahedronIndex++;
    }
    
    tetrahedrons() {
        return this.__tetrahedrons.values();
    }
    
    tetrahedronAt(index) {
        return this.__tetrahedrons[index];
    }

    _reportNewHalfFace(halfFace) {
        this.__halfFaces[this.__halfFaceIndex] = halfFace;
        halfFace._index = this.__halfFaceIndex;
        this.__halfFaceIndex++;
    }
    
    halfFaces() {
        return this.__halfFaces.values();
    }
    
    halfFaceAt(index) {
        return this.__halfFaces[index];
    }

    _reportNewHalfEdge(halfEdge) {
        this.__halfEdges[this.__halfEdgeIndex] = halfEdge;
        halfEdge._index = this.__halfEdgeIndex;
        this.__halfEdgeIndex++;
    }
    
    _reportNewFace(face) {
        this.__faces[this.__faceIndex] = face;
        face._index = this.__faceIndex;
        this.__faceIndex++;
    }

    faces() {
        return this.__faces.values();
    }

    faceAt(index) {
        return this.__faces[index];
    }
    
    _reportNewEdge(edge) {
        this.__edges[this.__edgeIndex] = edge;
        edge._index = this.__edgeIndex;
        this.__edgeIndex++;
    }
    
    edges() {
        return this.__edges.values();
    }

    edgeAt(index) {
        return this.__edges[index];
    }
    
    /**
    * A CavernGrid is a volumetric representation consisting of a grid of perturbed cube-like
    * structures called gems.
    *
    * Said gems, in turn, have additional tetrahedral structure inside them. 
    *
    * It is this internal tetrahedral structure in addition to the fact that the vertices can 
    * be drifted a small amount from their grid regimented anchor positions that allows for much 
    * more organic volumes to be represented than would be possible with a strict cubic voxel 
    * grid.
    *
    * Rather than only allowing straight "minecraft-like" features, a cavern-grid can represent 
    * volumes and surfaces with some degree of slant, fillets and chamfers in them.
    *
    * At the same time, because the representation remains essentially anchored to a three 
    * dimensional grid, we're still enjoying some of the benefits of that simpler representation,
    * i.e.: increased robustness, fast point location, limited local impact of mutations, etc.
    */
    constructor(width, height, depth) {
        if (width < 1 || height < 1 || depth < 1 
            || width !== Math.floor(width) || height !== Math.floor(height) || depth !== Math.floor(depth)) {
            throw new Error(`grid dimensions must all be integers greater than zero: [${width}, ${height}, ${depth}]`);
        }
        
        this.__width = width;
        this.__height = height;
        this.__depth = depth;

        const widthPlusOne = width + 1;
        const heightPlusOne = height + 1;
        const depthPlusOne = depth + 1;
        
        const numberOfGems = width * height * depth;
        const gems = new Array(numberOfGems);
        this.__gems = gems;
        
        const numberOfCenterVertices = numberOfGems;
        const numberOfCornerVertices = widthPlusOne * heightPlusOne * depthPlusOne;
        const numberOfVertices = numberOfCenterVertices + numberOfCornerVertices;
        const vertices = new Array(numberOfVertices);
        this.__vertices = vertices;
        
        const numberOfHalfShardsPerGem = 6;
        const numberOfHalfShards = numberOfHalfShardsPerGem * numberOfGems;
        this.__halfShards = new Array(numberOfHalfShards);
        this.__halfShardIndex = 0;

        const numberOfTetrahedronsPerHalfShard = 2;
        const numberOfTetrahedrons = numberOfHalfShards * numberOfTetrahedronsPerHalfShard;
        this.__tetrahedrons = new Array(numberOfTetrahedrons);
        this.__tetrahedronIndex = 0;

        const numberOfHalfFacesPerTetrahedron = 4;
        const numberOfHalfFaces = numberOfTetrahedrons * numberOfHalfFacesPerTetrahedron;
        this.__halfFaces = new Array(numberOfHalfFaces);
        this.__halfFaceIndex = 0;

        const numberOfHalfEdgesPerHalfFace = 3;
        const numberOfHalfEdges = numberOfHalfFaces * numberOfHalfEdgesPerHalfFace;
        this.__halfEdges = new Array(numberOfHalfEdges);
        this.__halfEdgeIndex = 0;
        
        const numberOfGemSides = numberOfHalfShards;
        const numberOfBoundaryGemSides = 2 * (width * height) + 2 * (width * depth) + 2 * (height * depth);
        const numberOfSharedGemSides = (numberOfGemSides - numberOfBoundaryGemSides) / 2;
        const numberOfShards = numberOfBoundaryGemSides + numberOfSharedGemSides;
        this.__shards = new Array(numberOfShards);
        this.__shardIndex = 0;
        
        const numberOfInternalGemFaces = 8;
        const numberOfExternalGemFacesPerSide = 2;
        const numberOfFaces = 
            numberOfShards * numberOfExternalGemFacesPerSide + 
            numberOfGems * numberOfInternalGemFaces;
        this.__faces = new Array(numberOfFaces);
        this.__faceIndex = 0;
        
        const numberOfInternalGemEdges = numberOfGems * 8;
        const numberOfExternalGemEdges = 
            depthPlusOne * widthPlusOne * height // level edges in y-direction
            + depthPlusOne * heightPlusOne * width // level edges in x-direction
            + widthPlusOne * heightPlusOne * depth // level edges in z-direction
            + widthPlusOne * height * depth // diagonal edges in x-direction
            + width * heightPlusOne * depth // diagonal edges in y-direction
            + width * height * depthPlusOne // diagonal edges in z-direction
        const numberOfGemEdges = numberOfInternalGemEdges + numberOfExternalGemEdges;
        this.__edges = new Array(numberOfGemEdges);
        this.__edgeIndex = 0;
        
        const widthPlusOne = width + 1;
        const heightPlusOne = height + 1;
        const depthPlusOne = depth + 1;
        
        let cornerVertexIndex = 0;
        for (let z = 0; z < depthPlusOne; z++) {
            for (let y = 0; y < heightPlusOne; y++) {
                for (let x = 0; x < widthPlusOne; x++) {
                    const cornerVertex = new Vertex(this, x, y, z);
                    vertices[cornerVertexIndex] = cornerVertex;
                    cornerVertex._index = cornerVertexIndex;
                    cornerVertexIndex++;
                }
            }
        }
        
        const cornerVerticesArea = widthPlusOne * heightPlusOne;
        let gemIndex = 0;
        let centerVertexIndex = numberOfCornerVertices;
        for (let z = 0; z < depth; z++) {
            const uOffset = z * cornerVerticesArea;
            const dOffset = (z+1) * cornerVerticesArea;
            for (let y = 0; y < height; y++) {
                const yy = y + 1;
                const yOffset = y * widthPlusOne;
                const yyOffset = yy * widthPlusOne;
                const unOffset = uOffset + yOffset;
                const usOffset = uOffset + yyOffset;
                const dnOffset = dOffset + yOffset;
                const dsOffset = dOffset + yyOffset;
                for (let x = 0; x < width; x++) {
                    const xx = x + 1;
                    const unw = cornerVertices[unOffset + x];
                    const une = cornerVertices[unOffset + xx];
                    const dnw = cornerVertices[dnOffset + x];
                    const dne = cornerVertices[dnOffset + xx];
                    const usw = cornerVertices[usOffset + x];
                    const use = cornerVertices[usOffset + xx];
                    const dsw = cornerVertices[dsOffset + x];
                    const dse = cornerVertices[dsOffset + xx];
                    
                    const center = new Vertex(this, x + .5, y + .5, z + .5);
                    vertices[centerVertexIndex] = center;
                    centerVertexIndex++;
                    
                    const gem = new Gem(this, unw, une, use, usw, dnw, dne, dse, dsw, center);
                    gems[gemIndex] = gem;
                    gem._index = gemIndex;
                    gemIndex++;
                }
            }
        }

        // connect halfshards in all directions

        const gemsArea = width * height;
        const widthMinusOne = width - 1;
        const heightMinusOne = height - 1;
        const depthMinusOne = depth - 1;
        
        for (let z = 0; z < depth; z++) {
            const uOffset = z * gemsArea;
            const dOffset = (z+1) * gemsArea;
            for (let y = 0; y < height; y++) {
                const nOffset = y * width;
                const sOffset = (y+1) * width;
                
                const unOffset = uOffset + nOffset;
                const usOffset = uOffset + sOffset;
                const dnOffset = dOffset + nOffset;
                
                for (let x = 0; x < width; x++) {
                    const wOffset = x;
                    const eOffset = (x+1);
                    
                    const unwIndex = unOffset + wOffset;
                    const unwGem = gems[unwIndex];
                    
                    if (x === 0) {
                        unwGem._wHalfShard._terminateAsBoundary(grid);
                    }
                    if (x < widthMinusOne) {
                        const uneIndex = unffset + eOffset;
                        const uneGem = gems[uneIndex];
                        unwGem._eHalfShard._connectWithOpposite(grid, uneGem._wHalfShard);
                    } else {
                        unwGem._eHalfShard._terminateAsBoundary(grid);   
                    }

                    if (y === 0) {
                        unwGem._nHalfShard._terminateAsBoundary(grid);
                    }
                    if (y < heightMinusOne) {
                        const uswIndex = usOffset + wOffset;
                        const uswGem = gems[uswIndex];
                        unwGem._sHalfShard._connectWithOpposite(grid, uswGem._nHalfShard);
                    } else {
                        unwGem._sHalfShard._terminateAsBoundary(grid); 
                    }
                    
                    if (z === 0) {
                        unwGem._uHalfShard._terminateAsBoundary(grid);
                    }
                    if (z < depthMinusOne) {
                        const dnwIndex = dnOffset + wOffset;
                        const dnwGem = gems[dnwIndex];
                        unwGem._dHalfShard._connectWithOpposite(grid, dnwGem._uHalfShard);
                    } else {
                        unwGem._dHalfShard._terminateAsBoundary(grid); 
                    }
                }
            }
        }
        
        // create internal/external edges and connect vertices with outgoing halfedges
        
        for (let z = 0; z < depth; z++) {
            const zOffset = z * gemsArea;
            for (let y = 0; y < height; y++) {
                const zyOffset = zOffset + y * width;
                for (let x = 0; x < width; x++) {
                    const gem = gems[zyOffset + x];
                    initialWitnessHalfEdges()
                    for (const halfEdge of gem._initialWitnessHalfEdges()) {
                        if (halfEdge.edge === null) {
                            halfEdge._connectWithSiblings(this);
                        }
                    }
                }
            }
        }
        
        /*
        
        if (true) { // north boundary
            for (let z = 0; z < depth; y++) {
                const zOffset = z * gemsArea;
                const yOffset = zOffset + 0 * width;
                for (let x = 0; x < width; x++) {
                    const gem = gems[yOffset + x];
                    gem.nHalfShard._terminateAsBoundary();
                }
            }
        }
        
        // north<->south
        for (let z = 0; z < depth; z++) {
            const zOffset = z * cornerVerticesArea;
            for (let y = 0; y < heightMinusOne; y++) {
                const nyOffset = y * width;
                const syOffset = (y+1) * width;
                for (let x = 0; x < width; x++) {
                    const nGem = gems[nyOffset + x];
                    const sGem = gems[syOffset + x];
                    nGem.sHalfShard._connectWithOpposite(grid, sGem.nHalfShard);
                }             
            }
        }

        if (true) { // south boundary
            const yTerm = heightMinusOne * width;
            for (let z = 0; z < depth; y++) {
                const zOffset = z * gemsArea;
                const yOffset = zOffset + yTerm;
                for (let x = 0; x < width; x++) {
                    const gem = gems[yOffset + x];
                    gem.sHalfShard._terminateAsBoundary();
                }
            }
        }

        if (true) { // east boundary
            const xTerm = widthMinusOne;
            for (let z = 0; z < depth; y++) {
                const zOffset = z * gemsArea;
                for (let y = 0; y < height; y++) {
                    const yOffset = zOffset + y * width;
                    const gem = gems[yOffset + xTerm];
                    gem.eHalfShard._terminateAsBoundary();
                }
            }
        }
        
        // east<->west
        for (let z = 0; z < depth; z++) {
            const zOffset = z * cornerVerticesArea;
            for (let y = 0; y < height; y++) {
                const yOffset = y * width;
                for (let x = 0; x < widthMinusOne; x++) {
                    const offset = yOffset + x;
                    const wGem = gems[offset];
                    const eGem = gems[offset + 1];
                    wGem.eHalfShard._connectWithOpposite(grid, eGem.wHalfShard);        
                }
            }
        }
        
        if (true) { // west boundary
            for (let z = 0; z < depth; y++) {
                const zOffset = z * gemsArea;
                for (let y = 0; y < height; y++) {
                    const yOffset = zOffset + y * width;
                    const gem = gems[yOffset + 0];
                    gem.wHalfShard._terminateAsBoundary();
                }
            }
        }

        if (true) { // up boundary
            const zOffset = 0;
            for (let y = 0; y < height; y++) {
                yOffset = zOffset + y * width;
                for (let x = 0; x < width; x++) {
                    const gem = gems[yOffset + x];
                    gem.uHalfShard._terminateAsBoundary();
                }
            }
        }
        
        // up<->down
        for (let z = 0; z < depthMinusOne; z++) {
            const uOffset = z * gemsArea;
            const dOffset = (z+1) * gemsArea;
            for (let y = 0; y < height; y++) {
                const yOffset = y * width;
                const uyOffset = uOffset + yOffset;
                const dyOffset = dOffset + yOffset;
                for (let x = 0; x < width; x++) {
                    const uGem = gems[uyOffset + x];
                    const dGem = gems[dyOffset + x];
                    uGem._dHalfShard._connectWithOpposite(grid, dGem.uHalfShard);
                }
            }
        }

        if (true) { // down boundary
            const zOffset = depthMinusOne * gemsArea;
            for (let y = 0; y < height; y++) {
                yOffset = zOffset + y * width;
                for (let x = 0; x < width; x++) {
                    const gem = gems[yOffset + x];
                    gem.dHalfShard._terminateAsBoundary();
                }
            }
        }
        
        // treat edges

        // set up outgoing halfedges for vertices (some overlap is tolerated)
                    
                    usw._someOutgoingHalfEdge = gem._sHalfShard._halfEdgeForVertices(usw, use);
                    use._someOutgoingHalfEdge = gem._sHalfShard._halfEdgeForVertices(use, usw);
                    
                    dsw._someOutgoingHalfEdge = gem._sHalfShard._halfEdgeForVertices(dsw, dse);
                    dse._someOutgoingHalfEdge = gem._sHalfShard._halfEdgeForVertices(dse, dsw);
                    
                    une._someOutgoingHalfEdge = gem._nHalfShard._halfEdgeForVertices(une, unw);
                    unw._someOutgoingHalfEdge = gem._nHalfShard._halfEdgeForVertices(unw, une);
                    
                    dne._someOutgoingHalfEdge = gem._nHalfShard._halfEdgeForVertices(dne, dnw);
                    dnw._someOutgoingHalfEdge = gem._nHalfShard._halfEdgeForVertices(dnw, dne);
                    
                    center._someOutgoingHalfEdge = gem._nHalfShard._halfEdgeForVertices(center, unw);
        
        // run a closure procedure over all the vertices in order to create 
        // common edge objects for all winged halfedge linked lists
        
        const waitingHalfEdges = [];
        const discoveredHalfEdges = new Set();
        
        waitingHalfEdges.push(vertex.someOutgoingHalfEdge);
        discoveredHalfEdges.add(vertex.someOutgoingHalfEdge);
        
        while (waitingHalfEdges.length > 0) {
            const halfEdge = waitingHalfEdges.pop();
            if (halfEdge.edge !== null) {
                continue;
            }
            let startHalfEdge = halfEdge;
            // find start halfEdge by iterating in reverse (opposite->neighbour) direction
            do {
                const oppositeHalfEdge = startHalfEdge.oppositeHalfEdge;
                if (oppositeHalfEdge === null) {
                    // we're at a boundary: starting in forward direction from here will be exhaustive
                    break;
                }
                const neighbourHalfEdge = oppositeHalfEdge.neighbourHalfEdge;
                if (neighbourHalfEdge === null) {
                    throw new Error(`invariant violation: halfEdge has no neighbour`);
                }
                startHalfEdge = neighbourHalfEdge;
            } while (startHalfEdge !== halfEdge); // we came back to start: forward pass will be trivially exhaustive
            // set common edge object by iterating in forward (neighbour->opposite) direction
            const edge = new Edge(grid, startHalfEdge);
            let currHalfEdge = startHalfEdge;
            do {
                currHalfEdge.edge = edge;
                if (!discoveredHalfEdges.has(currHalfEdge)) {
                    discoveredHalfEdges.add(currHalfEdge);
                }
                const currHalfEdge2 = currHalfEdge.nextHalfEdge;
                if (!discoveredHalfEdges.has(currHalfEdge2)) {
                    discoveredHalfEdges.add(currHalfEdge2);
                    waitingHalfEdges.push(currHalfEdge2);
                }
                const currHalfEdge3 = currHalfEdge2.nextHalfEdge;
                if (!discoveredHalfEdges.has(currHalfEdge3)) {
                    discoveredHalfEdges.add(currHalfEdge3);
                    waitingHalfEdges.push(currHalfEdge3);
                }
                const neighbourHalfEdge = currHalfEdge.neighbour;
                neighbourHalfEdge.edge = edge;
                if (!discoveredHalfEdges.has(neighbourHalfEdge)) {
                    discoveredHalfEdges.add(neighbourHalfEdge);
                }
                const neighbourHalfEdge2 = neighbourHalfEdge.nextHalfEdge;
                if (!discoveredHalfEdges.has(neighbourHalfEdge2)) {
                    discoveredHalfEdges.add(neighbourHalfEdge2);
                    waitingHalfEdges.push(neighbourHalfEdge2);
                }
                const neighbourHalfEdge3 = neighbourHalfEdge2.nextHalfEdge;
                if (!discoveredHalfEdges.has(neighbourHalfEdge3)) {
                    discoveredHalfEdges.add(neighbourHalfEdge3);
                    waitingHalfEdges.push(neighbourHalfEdge3);
                }
                currHalfEdge = neighbourHalfEdge.oppositeHalfEdge;
            } while (currHalfEdge !== null && currHalfEdge !== startHalfEdge)
        } */
    }
}

class Vertex {

    get grid() {
        return this.__grid;
    }

    get index() {
        return this._index;
    }
    
    get anchorX() {
        return this.__anchorX;
    }
    
    get anchorY() {
        return this.__anchorY;
    }
    
    get anchorZ() {
        return this.__anchorZ;
    }

    setDriftX(driftX) {
        if (driftX < -.5 || driftX > .5) {    
            throw new Error(`drift value must be between -.5 and .5`);
        }
        const newX = this.__anchorX + driftX;
        if (this.__x !== newX) {
            this.__x = newX;
            // TODO: notify drift
        }
    }

    getDriftX() {
        return this.__x - this.__anchorX;
    }

    setDriftY(driftY) {
        if (driftY < -.5 || driftY > .5) {    
            throw new Error(`drift value must be between -.5 and .5`);
        }
        const newY = this.__anchorY + driftY;
        if (newY !== this.__y) {
            this.__y = newY;
            // TODO: notify drift
        }
    }
    
    getDriftY() {
        return this.__y - this.__anchorY;
    }
    
    setDriftZ(driftZ) {
        if (driftZ < -.5 || driftZ > .5) {    
            throw new Error(`drift value must be between -.5 and .5`);
        }
        const newZ = this.__anchorZ + driftZ;
        if (newZ !== this.__z) {
            this.__z = newZ;
            // TODO: notify drift
        }
    }
    
    getDriftZ() {
        return this.__z - this.__anchorZ;
    }

    setX(x) {
        if (this.__x === x) {
            return;
        }
        const driftX = x - this.__anchorX;
        if (driftX < -.5 || driftX > .5) {    
            throw new Error(`drift value must be between -.5 and .5`);
        }
        this.__x = x;
        // TODO: notify
    }
    
    get x() {
        return this.__x;
    }

    setY(y) {
        if (this.__y === y) {
            return;
        }
        const driftY = y - this.__anchorY;
        if (driftY < -.5 || driftY > .5) {    
            throw new Error(`drift value must be between -.5 and .5`);
        }
        this.__y = y;
        // TODO: notify
    }
    
    get y() {
        return this.__y;
    }
    
    setZ(z) {
        if (this.__z === z) {
            return;
        }
        const driftZ = z - this.__anchorZ;
        if (driftZ < -.5 || driftZ > .5) {    
            throw new Error(`drift value must be between -.5 and .5`);
        }
        this.__z = z;
        // TODO: notify
    }
    
    get z() {
        return this.__z;
    }
    
    constructor(grid, anchorX, anchorY, anchorZ) {
        this.__grid = grid;
        this._index = -1; // set by parent grid
        this.__anchorX = anchorX;
        this.__anchorY = anchorY;
        this.__anchorZ = anchorZ;
        this.__x = anchorX;
        this.__y = anchorY;
        this.__z = anchorZ;
        this._someHalfEdge = null; 
    }
    
}

class Gem {

    get grid() {
        return this.__grid;
    }

    get index() {
        return this._index;
    }
    
    get nHalfShard() {
        return this._nHalfShard;
    }

    get eHalfShard() {
        return this._eHalfShard;
    }
    
    get sHalfShard() {
        return this._sHalfShard;
    }
    
    get wHalfShard() {
        return this._wHalfShard;
    }
    
    get uHalfShard() {
        return this._uHalfShard;
    }
    
    get dHalfShard() {
        return this._dHalfShard;
    }

    //
    
    _nuHalfEdge() {
        return this._nHalfShard.baseHalfEdge4;    
    }

    _neHalfEdge() {
        return this._nHalfShard.baseHalfEdge1;
    }

    _ndHalfEdge() {
        return this._nHalfShard.baseHalfEdge2;
    }
    
    _nwHalfEdge() {
        return this._nHalfShard.baseHalfEdge3;
    }
    
    _euHalfEdge() {
        return this._eHalfShard.baseHalfEdge3;
    }
    
    _edHalfEdge() {
        return this._eHalfShard.baseHalfEdge1;
    }
    
    _esHalfEdge() {
        return this._eHalfShard.baseHalfEdge4;
    }
    
    _suHalfEdge() {
        return this._sHalfShard.baseHalfEdge3;
    }
    
    _sdHalfEdge() {
        return this._sHalfShard.baseHalfEdge1;
    }
    
    _swHalfEdge() {
        return this._sHalfShard.baseHalfEdge4;
    }
    
    _wuHalfEdge() {
        return this._wHalfShard.baseHalfEdge4;
    }
    
    _wdHalfEdge() {
        return this._wHalfShard.baseHalfEdge2;
    }

    //

    _unHalfEdge() {
        return this._uHalfShard.baseHalfEdge4;    
    }

    _enHalfEdge() {
        return this._eHalfShard.baseHalfEdge2;
    }

    _dnHalfEdge() {
        return this._dHalfShard.baseHalfEdge3;
    }
    
    _wnHalfEdge() {
        return this._wHalfShard.baseHalfEdge1;
    }
    
    _ueHalfEdge() {
        return this._uHalfShard.baseHalfEdge3;
    }
    
    _deHalfEdge() {
        return this._dHalfShard.baseHalfEdge4;
    }
    
    _seHalfEdge() {
        return this._sHalfShard.baseHalfEdge2;
    }
    
    _usHalfEdge() {
        return this._uHalfShard.baseHalfEdge2;
    }
    
    _dsHalfEdge() {
        return this._dHalfShard.baseHalfEdge1;
    }
    
    _wsHalfEdge() {
        return this._wHalfShard.baseHalfEdge3;
    }
    
    _uwHalfEdge() {
        return this._uHalfShard.baseHalfEdge1;
    }
    
    _dwHalfEdge() {
        return this._dHalfShard.baseHalfEdge2;
    }
    
    //
    
    *_initialWitnessHalfEdges() {
        yield this._neHalfEdge();
        yield this._nwHalfEdge();
        yield this._nuHalfEdge();
        yield this._ndHalfEdge();
        
        yield this._esHalfEdge();
        yield this._euHalfEdge();
        yield this._edHalfEdge();
        
        yield this._swHalfEdge();
        yield this._suHalfEdge();
        yield this._sdHalfEdge();
        
        yield this._wuHalfEdge();
        yield this._wdHalfEdge();
        
        yield this._ndHalfEdge().nextHalfEdge; // north diagonal
        yield this._enHalfEdge().nextHalfEdge; // east diagonal
        yield this._seHalfEdge().nextHalfEdge; // south diagonal
        yield this._wdHalfEdge().nextHalfEdge; // west diagonal
        yield this._usHalfEdge().nextHalfEdge; // up diagonal
        yield this._dwHalfEdge().nextHalfEdge; // down diagonal

        yield this._neHalfEdge().neighbourHalfEdge.nextHalfEdge; // north half internal edge
        yield this._nwHalfEdge().neighbourHalfEdge.nextHalfEdge; // north half internal edge
        yield this._nuHalfEdge().neighbourHalfEdge.nextHalfEdge; // north half internal edge
        yield this._ndHalfEdge().neighbourHalfEdge.nextHalfEdge; // north half internal edge

        yield this._seHalfEdge().neighbourHalfEdge.nextHalfEdge; // south half internal edge
        yield this._swHalfEdge().neighbourHalfEdge.nextHalfEdge; // south half internal edge
        yield this._suHalfEdge().neighbourHalfEdge.nextHalfEdge; // south half internal edge
        yield this._sdHalfEdge().neighbourHalfEdge.nextHalfEdge; // south half internal edge
    }
    
    constructor(grid, unw, une, use, usw, dnw, dne, dse, dsw, center) {
        this.__grid = grid;
        this._index = -1; // set by parent grid
        
        const nHalfShard = new HalfShard(grid, this, une, dne, dnw, unw, center);
        const eHalfShard = new HalfShard(grid, this, dse, dne, une, use, center);
        const sHalfShard = new HalfShard(grid, this, dsw, dse, use, usw, center);
        const wHalfShard = new HalfShard(grid, this, unw, dnw, dsw, usw, center);
        const uHalfShard = new HalfShard(grid, this, unw, usw, use, une, center);
        const dHalfShard = new HalfShard(grid, this, dse, dsw, dnw, dne, center);
        
        const [nHS_eHF, nHS_dHF, nHS_wHF, nHS_uHF] = nHalfShard._initialSideHalfFaces();
        const [eHS_dHF, eHS_nHF, eHS_uHF, eHS_sHF] = eHalfShard._initialSideHalfFaces();
        const [sHS_dHF, sHS_eHF, sHS_uHF, sHS_wHF] = sHalfShard._initialSideHalfFaces();
        const [wHS_nHF, wHS_dHF, wHS_sHF, wHS_uHF] = wHalfShard._initialSideHalfFaces();
        const [uHS_wHF, uHS_sHF, uHS_eHF, uHS_nHF] = uHalfShard._initialSideHalfFaces();
        const [dHS_sHF, dHS_wHF, dHS_nHF, dHS_eHF] = dHalfShard._initialSideHalfFaces();
        
        nHS_eHF._connectWithOpposite(grid, eHS_nHF);
        nHS_dHF._connectWithOpposite(grid, dHS_nHF);
        nHS_wHF._connectWithOpposite(grid, wHS_nHF);
        nHS_uHF._connectWithOpposite(grid, uHS_nHF);
        
        eHS_dHF._connectWithOpposite(grid, dHS_eHF);
        eHS_nHF._connectWithOpposite(grid, nHS_eHF);
        eHS_uHF._connectWithOpposite(grid, uHS_eHF);
        eHS_sHF._connectWithOpposite(grid, sHS_eHF);
        
        sHS_wHF._connectWithOpposite(grid, wHS_sHF);
        sHS_dHF._connectWithOpposite(grid, dHS_sHF);
        sHS_eHF._connectWithOpposite(grid, eHS_sHF);
        sHS_uHF._connectWithOpposite(grid, uHS_sHF);
       
        wHS_nHF._connectWithOpposite(grid, nHS_wHF);
        wHS_dHF._connectWithOpposite(grid, dHS_wHF);
        wHS_sHF._connectWithOpposite(grid, sHS_wHF);
        wHS_uHF._connectWithOpposite(grid, uHS_wHF);
        
        uHS_wHF._connectWithOpposite(grid, wHS_uHF);
        uHS_sHF._connectWithOpposite(grid, sHS_uHF);
        uHS_eHF._connectWithOpposite(grid, eHS_uHF);
        uHS_nHF._connectWithOpposite(grid, nHS_uHF);
        
        dHS_sHF._connectWithOpposite(grid, sHS_dHF);
        dHS_wHF._connectWithOpposite(grid, wHS_dHF);
        dHS_nHF._connectWithOpposite(grid, nHS_dHF);
        dHS_eHF._connectWithOpposite(grid, eHS_dHF);

        this._nHalfShard = nHalfShard;
        this._eHalfShard = eHalfShard;
        this._sHalfShard = sHalfShard;
        this._wHalfShard = wHalfShard;
        this._uHalfShard = uHalfShard;
        this._dHalfShard = dHalfShard;

        // create internal edges

        /*for (const halfEdge of nHalfShard._sideHalfEdges()) {
            halfEdge._connectWithSiblings(grid);
        }
        for (const halfEdge of sHalfShard._sideHalfEdges()) {
            halfEdge._connectWithSiblings(grid);
        }*/
    }
}


class HalfShard {

    get gem() {
        return this.__gem;
    }
    
    get index() {
        return this._index;
    }
    
    tetrahedron1() {
        return this._baseHalfEdge1.halfFace.tetrahedron;
    }
    
    tetrahedron2() {
        return this._baseHalfEdge2.halfFace.tetrahedron;
    }
    
    get oppositeHalfShard() {
        return this._oppositeHalfShard;
    }
    
    get shard() {
        return this._shard;
    }
    
    constructor(grid, gem, baseVertex1, baseVertex2, baseVertex3, baseVertex4, topVertex) {
        this.__gem = gem;
        this._index = -1;

        const tetrahedron1 = new Tetrahedron(grid, this, baseVertex1, baseVertex2, baseVertex3, topVertex);
        const tetrahedron2 = new Tetrahedron(grid, this, baseVertex3, baseVertex4, baseVertex1, topVertex);
        
        //this.__tetrahedron1 = tetrahedron1;
        //this.__tetrahedron2 = tetrahedron2;
        
        const baseHalfFace1 = tetrahedron1.baseHalfFace;
        const baseHalfEdge1 = baseHalfFace1.firstHalfEdge;
        const baseHalfEdge2 = baseHalfEdge1.nextHalfEdge;

        const baseHalfFace2 = tetrahedron2.baseHalfFace;
        const baseHalfEdge3 = baseHalfFace2.firstHalfEdge;
        const baseHalfEdge4 = baseHalfEdge3.nextHalfEdge;

        this._baseHalfEdge1 = baseHalfEdge1;
        this._baseHalfEdge2 = baseHalfEdge2;
        this._baseHalfEdge3 = baseHalfEdge3;
        this._baseHalfEdge4 = baseHalfEdge4;
        
        this._oppositeHalfShard = null;
        this._shard = null;
        
        grid._reportNewHalfShard(this); // sets this._index
    }

    *_sideHalfEdges() {
        for (const baseHalfEdge of this._baseHalfEdges()) {
            yield baseHalfEdge.neighbourHalfEdge.nextHalfEdge;
        }
    }
    
    *_baseHalfEdges() {
        const tetrahedron1 = this.tetrahedron1();
        const baseHalfFace1 = tetrahedron1.baseHalfFace;
        let baseHalfEdge = baseHalfFace1.firstHalfEdge;
        yield baseHalfEdge;
        baseHalfEdge = baseHalfEdge.nextHalfEdge;
        yield baseHalfEdge;
        const tetrahedron2 = this.tetrahedron2();
        const baseHalfFace2 = tetrahedron2.baseHalfFace;
        baseHalfEdge = baseHalfFace2.firstHalfEdge;
        yield baseHalfEdge;
        baseHalfEdge = baseHalfEdge.nextHalfEdge;
        yield baseHalfEdge;
    }
    
    *_initialSideHalfFaces() {
        for (const baseHalfEdge of this._baseHalfEdges()) {
            yield baseHalfEdge.halfFace;
        }
    }

    _connectWithOpposite(grid, oppositeHalfShard) {
        const tetrahedron1 = this.tetrahedron1();
        const tetrahedron2 = this.tetrahedron2();
        const baseHalfFace1 = tetrahedron1.baseHalfFace;
        const baseHalfFace2 = tetrahedron1.baseHalfFace;

        const oppositeTetrahedron1 = oppositeHalfShard.tetrahedron1();
        const oppositeTetrahedron2 = oppositeHalfShard.tetrahedron2();
        const oppositeBaseHalfFace1 = oppositeTetrahedron1.baseHalfFace;
        const oppositeBaseHalfFace2 = oppositeTetrahedron2.baseHalfFace;
        
        if (baseHalfFace1._canBeOppositeTo(oppositeBaseHalfFace1)) {
            if (!baseHalfFace2._canBeOppositeTo(oppositeBaseHalfFace2)) {
                throw new Error(`invariant violation: shard base halfFaces don't match`);
            }
            baseHalfFace1._connectWithOpposite(grid, oppositeBaseHalfFace1);
            baseHalfFace2._connectWithOpposite(grid, oppositeBaseHalfFace2);
        } else if (baseHalfFace1._canBeOppositeTo(oppositeBaseHalfFace2)) {
            if (!baseHalfFace2._canBeOppositeTo(oppositeBaseHalfFace1)) {
                throw new Error(`invariant violation: shard base halfFaces don't match`);
            }
            baseHalfFace1._connectWithOpposite(grid, oppositeBaseHalfFace2);
            baseHalfFace2._connectWithOpposite(grid, oppositeBaseHalfFace1);
        }

        this.oppositeHalfShard = oppositeHalfShard;
        oppositeHalfShard.oppositeHalfShard = this;
        
        const shard = new Shard(grid, this);
        this.shard = shard;
        oppositeHalfShard.shard = shard;
    }

    _terminateAsBoundary(grid) {
        const shard = new Shard(grid, this);
        this.shard = shard;        
    }

    _halfEdgeForVertices(sourceVertex, targetVertex) {
        const tetrahedron1 = this.tetrahedron1();
        const baseHalfFace1 = tetrahedron1.baseHalfFace;
        const firstAttemptHalfEdge = baseHalfFace1._halfEdgeForVerticesOrNull(sourceVertex, targetVertex);
        if (firstAttemptHalfEdge !== null) {
            return firstAttemptHalfEdge;
        }
        const tetrahedron2 = this.tetrahedron2();
        const baseHalfFace2 = tetrahedron2.baseHalfFace;
        return baseHalfFace2._halfEdgeForVertices(sourceVertex, targetVertex);
    }

    _flip() {
        
        /* This method performs a flip on the tetrahedralization of the perturbed four-sided pyramid that 
         * is the half-shard.
         *
         * In other words: the two tetrahedrons that together make up the perturbed four-sided pyramid are
         * transformed into two alternative tetrahedrons that make up the same volume (in the convex case at
         * least) but have their shared face oriented differently.
         *
         * Note that, for any convex half-shard, there are, in general, two possible orientations for their
         * shared, triangular, face.
         *
         * Moreover, for a non-convex half-shard that has its corner vertices perturbed but is still linearly
         * separated on the grid (like a 3D-chevron shape) there will be one possible well-formed orientation 
         * that properly tetrahedralizes the volume [TODO: is this true?]   
         *
         * To visualize the code in this method, it's recommended to use pen and paper: draw the two 
         * tetrahedrons with their joined quadrilateral base flat in the center and then draw the 4 
         * exposed triangular side-faces folded outwards like a four-pointed star.
         *
         * The two faces that are shared between the two tetrahedrons (the ones that are actually
         * being flipped) then need to be drawn flat, separately, and imagined to be sticking up from
         * the page at the diagonal that is to be flipped.
         *
         * Visualizing flat like that is the recommended way of understanding this code. First, annotate all
         * the halfedges and write their labels. Next, step through the code and refer to the diagram
         * repeatedly. While doing so, mentally "glue" the two separate faces onto the diagonal and fold 
         * the tetrahedrons back together around them.
         *
         * If that proves hard, at first, try going back and-forth a few times, by mentally flattening
         * them back on the page before mentally re-folding them into the third dimension.
         *
         * If all else fails: get out a pair of scissors and physically perform the aforementioned 
         * flattening/refolding of the half-shard. You may even want to do that for several perturbations 
         * in order to see how the convex case (that allow two orientations) transforms into the 
         * non-convex case (that allows only one)
         *
         * This allows us to gain an intuition for how the halfedges at the seams of the flattened 
         * representation fit back together in 3D. We need to do this in order to understand the 
         * neighbouring and opposite relations between them.
         *
         * Next, to understand the flipping action, draw the same diagram with the diagonal flipped. 
         * With that, compare that target situation to the original situation at every step. This 
         * allows us to see how to convert the former into the latter.
         *
         * Note that visualizing in 3D directly gets to be a tangled mess because of occlusion effects. 
         * 
         * Even though we live in 3 spatial dimensions and we "understand" 3D space to some extend, 
         * we, perhaps unfortunately, do not posses "volumetric vision." 
         *
         * Instead, we have to "make do" with 2D-stereoscopic vision. 
         *
         * As such, when we attempt to visualize directly in 3D, we can no longer read off the labels 
         * we assigned to the halfedges. That's why flattening the visualization is crucial for 
         * understanding this code (unless you're a savant or ASI of course).
         */
        
        const tetrahedron1 = this.tetrahedron1();
        const tetrahedron2 = this.tetrahedron2();
        
        const baseHalfFace1 = tetrahedron1.baseHalfFace;
        const baseHalfFace2 = tetrahedron2.baseHalfFace;

        // unpack base faces
        
        const [baseHalfEdge11, baseHalfEdge12, baseHalfEdge13] = baseHalfFace1.halfEdges();
        const baseVertex11 = baseHalfEdge11.sourceVertex;
        const baseVertex12 = baseHalfEdge12.sourceVertex;
        const baseVertex13 = baseHalfEdge13.sourceVertex;

        const [baseHalfEdge23, baseHalfEdge24, baseHalfEdge21] = baseHalfFace2.halfEdges();
        const baseVertex23 = baseHalfEdge23.sourceVertex;
        const baseVertex24 = baseHalfEdge24.sourceVertex;
        const baseVertex21 = baseHalfEdge21.sourceVertex;

        if (baseVertex21 !== baseVertex11) {
            throw new Error(`invariant violation`);
        }
        if (baseVertex13 !== baseVertex23) {
            throw new Error(`invariant violation`);
        }

        // unpack side faces 1-side
        
        const sideHalfEdge111 = baseHalfEdge11.neighbourHalfEdge;
        const sideHalfEdge112 = sideHalfEdge111.nextHalfEdge;
        const sideHalfEdge113 = sideHalfEdge112.nextHalfEdge;
        
        const sideHalfEdge121 = baseHalfEdge12.neighbourHalfEdge;
        const sideHalfEdge122 = baseHalfEdge121.nextHalfEdge;
        const sideHalfEdge123 = baseHalfEdge122.nextHalfEdge;
        
        const sideHalfEdge131 = baseHalfEdge13.neighbourHalfEdge;
        const sideHalfEdge132 = baseHalfEdge131.nextHalfEdge;
        const sideHalfEdge133 = baseHalfEdge132.nextHalfEdge;
    
        const sideHalfEdge231 = baseHalfEdge23.neighbourHalfEdge;
        const sideHalfEdge232 = sideHalfEdge231.nextHalfEdge;
        const sideHalfEdge233 = sideHalfEdge232.nextHalfEdge;
        
        const sideHalfEdge241 = baseHalfEdge24.neighbourHalfEdge;
        const sideHalfEdge242 = baseHalfEdge241.nextHalfEdge;
        const sideHalfEdge243 = baseHalfEdge242.nextHalfEdge;
        
        const sideHalfEdge211 = baseHalfEdge21.neighbourHalfEdge;
        const sideHalfEdge212 = baseHalfEdge211.nextHalfEdge;
        const sideHalfEdge213 = baseHalfEdge212.nextHalfEdge;

        // flip sourceVertices of relevant halfedges

        baseHalfEdge13.sourceVertex = baseVertex24;
        baseHalfEdge21.sourceVertex = baseVertex12;
        sideHalfEdge131.sourceVertex = baseVertex12;
        sideHalfEdge211.sourceVertex = baseVertex24;
        sideHalfEdge132.sourceVertex = baseVertex24;
        sideHalfEdge212.sourceVertex = baseVertex12;

        // adapt next halfedge relations

        baseHalfEdge11.nextHalfEdge = baseHalfEdge21;
        baseHalfEdge21.nextHalfEdge = baseHalfEdge24;

        baseHalfEdge23.nextHalfEdge = baseHalfEdge13;
        baseHalfEdge13.nextHalfEdge = baseHalfEdge12;

        baseHalfEdge11.halfFace._halfEdge1 = baseHalfEdge12;
        baseHalfEdge23.halfFace._halfEdge1 = baseHalfEdge24;
        
        baseHalfEdge11.halfFace = baseHalfEdge21.halfFace;
        baseHalfEdge23.halfFace = baseHalfEdge13.halfFace;
        
        // adapt neighbouring relations

        sideHalfEdge243.neighbourHalfEdge = sideHalfEdge112; // unlink
        sideHalfEdge112.neighbourHalfEdge = sideHalfEdge243;
        
        sideHalfEdge133.neighbourHalfEdge = sideHalfEdge122; // relink
        sideHalfEdge122.neighbourHalfEdge = sideHalfEdge133;
        sideHalfEdge113.neighbourHalfEdge = sideHalfEdge212;
        sideHalfEdge212.neighbourHalfEdge = sideHalfEdge113;

        sideHalfEdge232.neighbourHalfEdge = sideHalfEdge123; // unlink
        sideHalfEdge123.neighbourHalfEdge = sideHalfEdge232;

        sideHalfEdge132.neighbourHalfEdge = sideHalfEdge233; // relink
        sideHalfEdge233.neighbourHalfEdge = sideHalfEdge132;
        sideHalfEdge213.neighbourHalfEdge = sideHalfEdge242;
        sideHalfEdge242.neighbourHalfEdge = sideHalfEdge213;
    }
}

class Shard {
    
    get index() {
        return this._index;
    }
    
    get someHalfShard() {
        return this._someHalfShard;
    }

    isFlipped() {
        return this.__flipped;
    }
    
    constructor(grid, someHalfShard) {
        this._index = -1;
        this.__someHalfShard = someHalfShard;
        this.__flipped = false;
        
        grid._reportNewShard(this); // sets this._index
    }

    setFlipped(flipped) {
		if (flipped !== this.__flipped) {
			this.flip();
		}
	}
	
	flip() {
        const halfShard1 = this.someHalfShard;
        halfShard1._flip();
        const halfShard2 = halfShard1.oppositeHalfShard;
        if (halfShard2 !== null) {
            halfShard2._flip();
        }
        this.__flipped = !this.__flipped;
    }
    
}

class Tetrahedron {

    get halfShard() {
        return this.__halfShard;
    }
    
    get index() {
        return this._index;
    }

    get baseHalfFace() {
        return this.__baseHalfFace;
    }
    
    constructor(grid, halfShard, baseVertex1, baseVertex2, baseVertex3, topVertex) {
        this.__halfShard = halfShard;
        this._index = -1;
        
        const baseHalfFace = new HalfFace(grid, this, baseVertex1, baseVertex2, baseVertex3);
        const sideHalfFace1 = new HalfFace(grid, this, baseVertex2, baseVertex1, topVertex);
        const sideHalfFace2 = new HalfFace(grid, this, baseVertex3, baseVertex2, topVertex);
        const sideHalfFace3 = new HalfFace(grid, this, baseVertex1, baseVertex3, topVertex);
        
        const [bhe1, bhe2, bhe3] = baseHalfFace._halfEdges();
        const [s1he1, s1he2, s1he3] = sideHalfFace1._halfEdges();
        const [s2he1, s2he2, s2he3] = sideHalfFace2._halfEdges();
        const [s3he1, s3he2, s3he3] = sideHalfFace3._halfEdges();
        
        bhe1._connectWithNeighbour(s1he1);
        bhe2._connectWithNeighbour(s2he1);
        bhe3._connectWithNeighbour(s3he1);
        s1he2._connectWithNeighbour(s3he3);
        s2he2._connectWithNeighbour(s1he3);
        s3he2._connectWithNeighbour(s2he3);
        
        this.__baseHalfFace = baseHalfFace;

        grid._reportNewTetrahedron(this); // sets this._index
    }

    *halfFaces() {
        let halfFace = this.baseHalfFace;
        yield halfFace;
        let currHalfEdge = halfFace.someHalfEdge;
        yield currHalfEdge.neighbourHalfEdge.halfFace;
        currHalfEdge = currHalfEdge.nextHalfEdge;
        yield currHalfEdge.neighbourHalfEdge.halfFace;
        currHalfEdge = currHalfEdge.nextHalfEdge;
        yield currHalfEdge.neighbourHalfEdge.halfFace;
    }
    
    /*_halfFaceForVertices(vertexA, vertexB, vertexC) {
        for (const halfFace of this.halfFaces()) {
            if (halfFace._matchesVertices(vertexA, vertexB, vertexC)) {
                return halfFace;
            }
        }
        throw new Error(`invariant violation: no halfFace matching given vertices`);
    }*/
}

class HalfFace {

    get tetrahedron() {
        return this.__tetrahedron;
    }
    
    get index() {
        return this._index;
    }

    get firstHalfEdge() {
        return this._halfEdge1;
    }
    
    constructor(grid, tetrahedron, vertex1, vertex2, vertex3) {
        this.__tetrahedron = tetrahedron;
        this._index = -1;
        const halfEdge1 = new HalfEdge(grid, this, vertex1);
        const halfEdge2 = new HalfEdge(grid, this, vertex2);
        const halfEdge2 = new HalfEdge(grid, this, vertex3);
        halfEdge1.nextHalfEdge = halfEdge2;
        halfEdge2.nextHalfEdge = halfEdge3;
        halfEdge3.nextHalfEdge = halfEdge1;
        this._halfEdge1 = halfEdge1;
        this._face = null;
        grid._reportNewHalfFace(this);
    }

    *halfEdges() {
        let currHalfEdge = this.halfEdge1;
        yield currHalfEdge;
        currHalfEdge = currHalfEdge.nextHalfEdge;
        yield currHalfEdge;
        currHalfEdge = currHalfEdge.nextHalfEdge;
        yield currHalfEdge;
    }
    
    _matchesVertices(vertexA, vertexB, vertexC) {
        for (const halfEdge of this.halfEdges()) {
            if (halfEdge.sourceVertex === vertexA) {
                const nextHalfEdge = halfEdge.nextHalfEdge;
                if (nextHalfEdge.sourceVertex === vertexB) {
                    const nextNextHalfEdge = nextHalfEdge.nextHalfEdge;
                    if (nextNextHalfEdge.sourceVertex === vertexC) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    _halfEdgeForVerticesOrNull(sourceVertex, targetVertex) {
        for (const halfEdge of this.halfEdges()) {
            if (halfEdge._matchesVertices(sourceVertex, targetVertex)) {
                return halfEdge;
            }
        }
        return null;
    }
    
    _halfEdgeForVertices(sourceVertex, targetVertex) {
        const halfEdge = this._halfEdgeForVerticesOrNull(sourceVertex, targetVertex);
        if (halfEdge !== null) {   
            return halfEdge;
        }
        throw new Error(`invariant violation: no halfEdge matching given vertices`);
    }

    halfEdge2() {
        return this.halfEdge1.nextHalfEdge;
    }
    
    halfEdge3() {
        return this.halfEdge2().nextHalfEdge;
    }
    
    vertex1() {
        return this.halfEdge1.sourceVertex;
    }
    
    vertex2() {
        return this.halfEdge2().sourceVertex;
    }
    
    vertex3() {
        return this.halfEdge3().sourceVertex;
    }
    
    *vertices() {
        for (const halfEdge of this.halfEdges()) {
            yield halfEdge.sourceVertex;
        }
    }

    _canBeOppositeTo(oppositeHalfFace) {
        const [myVertex1, myVertex2, myVertex3] = this.vertices();
        const [oppVertexA, oppVertexB, oppVertexC] = oppositeHalfFace.vertices();
        if (myVertex1 === oppVertexA) {
            if (oppVertexB === myVertex3 && oppVertexC !== myVertex2) {
                return true;
            }
            return false;
        } else if (myVertex1 === oppVertexB) {
            if (oppVertexC === myVertex1 && oppVertexA === myVertex2) {
                return true;
            }
            return false;
        } else if (myVertex1 === oppVertexC) {
            if (oppVertexA === myVertex3 && oppVertexB === myVertex2) {
                return true;
            }
            return false;
        }
        return false;
    }
    
    _connectWithOpposite(grid, oppositeHalfFace) {
        const [myVertex1, myVertex2, myVertex3] = this.vertices();
        /* start: defensive */
        const [oppVertexA, oppVertexB, oppVertexC] = oppositeHalfFace.vertices();
        if (myVertex1 === oppVertexA) {
            if (oppVertexB !== myVertex3 || oppVertexC !== myVertex2) {
                throw new Error(`invariant violation: opposite face vertices cannot be matched`);
            }
        } else if (myVertex1 === oppVertexB) {
            if (oppVertexC !== myVertex1 || oppVertexA !== myVertex2) {
                throw new Error(`invariant violation: opposite face vertices cannot be matched`);
            }
        } else if (myVertex1 === oppVertexC) {
            if (oppVertexA !== myVertex3 || oppVertexB !== myVertex2) {
                throw new Error(`invariant violation: opposite face vertices cannot be matched`);
            }
        } else {
            throw new Error(`invariant violation: opposite face vertices cannot be matched`);
        }
        /* end: defensive */
        this._halfEdgeForVertices(myVertex1, myVertex2)
                ._connectWithOpposite(oppositeHalfFace
                                      ._halfEdgeForVertices(myVertex2, myVertex1));
        this._halfEdgeForVertices(myVertex2, myVertex3)
            ._connectWithOpposite(oppositeHalfFace
                                  ._halfEdgeForVertices(myVertex3, myVertex2));
        this._halfEdgeForVertices(myVertex3, myVertex1)
            ._connectWithOpposite(oppositeHalfFace
                                  ._halfEdgeForVertices(myVertex1, myVertex3));
        const face = new Face(grid, this);
        if (this.face !== null) {
            throw new Error(`invariant violation: face set twice`);
        }
        this.face = face;
        if (oppositeHalfFace.face !== null) {
            throw new Error(`invariant violation: face set twice`);
        }
        oppositeHalfFace.face = face;
    }
}

class Face {

    get someHalfFace() {
        return this.__someHalfFace;
    }
    
    get index() {
        return this._index;
    }
    
    constructor(grid, someHalfFace) {
        this._index = -1;
        this.__someHalfFace = someHalfFace;
        
        grid._reportNewFace(this);
    }
    
}

class HalfEdge {

    get halfFace() {
        return this._halfFace;
    }
    
    get index() {
        return this._index;
    }

    get sourceVertex() {
        return this._sourceVertex;
    }

    get nextHalfEdge() {
        return this._nextHalfEdge;
    }

    get neighbourHalfEdge() {
        return this._neighbourHalfEdge;
    }

    get oppositeHalfEdge() {
        return this._oppositeHalfEdge;
    }
    
    get edge() {
        return this._edge;
    }
    
    constructor(grid, halfFace, sourceVertex) {
        this._halfFace = halfFace;
        this._index = -1;
        this._sourceVertex = sourceVertex; 
        this._nextHalfEdge = null;
        this._neighbourHalfEdge = null;
        this._oppositeHalfEdge = null;
        this._edge = null;
        grid._reportNewHalfEdge(this);
    }

    _matchesVertices(sourceVertex, targetVertex) {
        if (this.sourceVertex !== sourceVertex) {
            return false;
        }
        if (this.targetVertex() !== targetVertex) {
            return false;
        }
        return true;
    }

    targetVertex() {
        return this.nextHalfEdge.sourceVertex;
    }

    _connectWithNeighbour(neighbourHalfEdge) {
        this.neighbourHalfEdge = neighbourHalfEdge;
        neighbourHalfEdge.neighbourHalfEdge = this;
    }
    
    _connectWithOpposite(oppositeHalfEdge) {
        this.oppositeHalfEdge = oppositeHalfEdge;
        oppositeHalfEdge.oppositeHalfEdge = this;
        /*const edge = new Edge(grid, this);
        if (this.edge !== null) {
            throw new Error(`invariant violation: edge set twice`);
        }
        this.edge = edge;
        if (oppositeHalfEdge.edge !== null) {
            throw new Error(`invariant violation: edge set twice`);
        }
        oppositeHalfEdge.edge = edge;*/
    }

    _connectWithSiblings(grid) {
        if (this.edge !== null) {
            throw new Error(`invariant violation: halfEdge already connected with siblings through common edge`);
        }
        
        let startHalfEdge = this;
        do {
            const oppositeHalfEdge = startHalfEdge.oppositeHalfEdge;
            if (oppositeHalfEdge === null) {
                break;
            }
            startHalfEdge = oppositeHalfEdge.neighbourHalfEdge;
        } while (startHalfEdge !== this);
        
        let endHalfEdge = this.neighbourHalfEdge;
        do {
            const oppositeHalfEdge = endHalfEdge.oppositeHalfEdge;
            if (oppositeHalfEdge === null) {
                break;
            }
            endHalfEdge = oppositeHalfEdge.neighbourHalfEdge;
        } while (endHalfEdge !== this.neighbourHalfEdge);

        const vertex = startHalfEdge.sourceVertex;
        if (vertex1.someOutgoingHalfEdge === null) {
            vertex1.someOutgoingHalfEdge = startHalfEdge;
        }
        
        const vertex2 = endHalfEdge.sourceVertex;
        if (vertex2.someOutgoingHalfEdge === null) {
            vertex2.someOutgoingHalfEdge = endHalfEdge;
        }
        
        const edge = new Edge(grid, this);
        let currHalfEdge = startHalfEdge;
        do {
            currHalfEdge.edge = edge;
            currHalfEdge = currHalfEdge.neighbourHalfEdge;
            currHalfEdge.edge = edge;
            currHalfEdge = currHalfEdge.oppositeHalfEdge;
        } while (currHalfEdge !== null && currHalfEdge !== startHalfEdge);
    }
}

class Edge {

    get someHalfEdge() {
        return this._startHalfEdge;
    }
    
    get index() {
        return this._index;
    }
    
    constructor(grid, startHalfEdge) {
        this._startHalfEdge = startHalfEdge; // chosen so that the iterator below is exhaustive
        this._index = -1;
        grid._reportNewEdge(this);
    }

    *halfEdges() {
        const startHalfEdge = this._startHalfEdge;
        let currHalfEdge = startHalfEdge;
        do {
            yield currHalfEdge;
            const neighbourHalfEdge = currHalfEdge.neighbour;
            yield neighbourHalfEdge;
            currHalfEdge = neighbourHalfEdge.oppositeHalfEdge;
        } while (currHalfEdge !== null && currHalfEdge !== startHalfEdge)
    }
}