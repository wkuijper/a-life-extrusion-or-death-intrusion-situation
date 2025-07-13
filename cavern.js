class CavernGrid {

    /**
    * A CavernGrid is a volumetric representation consisting of a grid of perturbed "cubes" 
    * (they're not actually geometric cubes so we call them /gems/ instead) with additional,
    * tetrahedral structure inside them. This internal tetrahedral structure in addition to the
    * fact that the vertices can be shifted a small amount from their grid regimented positions
    * allows for much more organic volumes to be represented.
    *
    * Rather than only allowing strict cubic "minecraft-like" features, a cavern-grid can 
    * represent volumes and surfaces with some degree of slant, fillets and chamfers in them.
    *
    * At the same time, because the representation remains essentially homeomorphic to a three 
    * dimensional grid, we're still enjoying some of the benefits of that simpler representation,
    * i.e.: increased robustness, fast point location, limited local impact of mutations to the 
    * mesh, etc.
    */
    constructor(width, height, depth) {
        this.width = width;
        this.height = height;
        this.depth = depth;
        const numberOfGems = width * height * depth;
        const gems = new Array(numberOfGems);
        const numberOfCenterVertices = numberOfGems;
        const centerVertices = new Array(numberOfCenterVertices);
        const widthPlusOne = width + 1;
        const heightPlusOne = height + 1;
        const depthPlusOne = depth + 1;
        const numberOfCornerVertices = widthPlusOne * heightPlusOne * depthPlusOne;
        const cornerVertices = new Array(numberOfCornerVertices);
        let index = 0;
        for (let z = 0; z < depthPlusOne; z++) {
            for (let y = 0; y < heightPlusOne; y++) {
                for (let x = 0; x < widthPlusOne; x++) {
                    const cornerVertex = new Vertex(this, x, y, z);
                    cornerVertices[index] = cornerVertex;
                    index++;
                }
            }
        }
        const cornerVerticesArea = widthPlusOne * heightPlusOne;
        index = 0;
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
                    centerVertices[index] = center;
                    const gem = new Gem(this, x, y, z, unw, une, use, usw, dnw, dne, dse, dsw, center);
                    gems[index] = gem;

                    // set up outgoing halfedges for vertices (some overlap is tolerated)
                    
                    usw.someOutgoingHalfEdge = gem.sHalfShard.getHalfEdgeForVertices(usw, use);
                    use.someOutgoingHalfEdge = gem.sHalfShard.getHalfEdgeForVertices(use, usw);
                    
                    dsw.someOutgoingHalfEdge = gem.sHalfShard.getHalfEdgeForVertices(dsw, dse);
                    dse.someOutgoingHalfEdge = gem.sHalfShard.getHalfEdgeForVertices(dse, dsw);
                    
                    une.someOutgoingHalfEdge = gem.nHalfShard.getHalfEdgeForVertices(une, unw);
                    unw.someOutgoingHalfEdge = gem.nHalfShard.getHalfEdgeForVertices(unw, une);
                    
                    dne.someOutgoingHalfEdge = gem.nHalfShard.getHalfEdgeForVertices(dne, dnw);
                    dnw.someOutgoingHalfEdge = gem.nHalfShard.getHalfEdgeForVertices(dnw, dne);
                    
                    center.someOutgoingHalfEdge = gem.nHalfShard.getHalfEdgeForVertices(center, unw);

                    index++;
                }
            }
        }

        // connect halfshards in all directions

        // up<->down
        const gemArea = width * height;
        const depthMinusOne = depth - 1;
        for (let z = 0; z < depthMinusOne; z++) {
            const uOffset = z * gemArea;
            const dOffset = (z+1) * gemArea;
            for (let y = 0; y < height; y++) {
                const yOffset = y * width;
                const uyOffset = uOffset + yOffset;
                const dyOffset = dOffset + yOffset;
                for (let x = 0; x < width; x++) {
                    const uGem = gems[uyOffset + x];
                    const dGem = gems[dyOffset + x];
                    uGem.dHalfShard._connectWithOpposite(dGem.uHalfShard);
                }
            }
        }

        // north<->south
        const heightMinusOne = height - 1;
        for (let z = 0; z < depth; z++) {
            const zOffset = z * cornerVerticesArea;
            for (let y = 0; y < heightMinusOne; y++) {
                const nyOffset = y * width;
                const syOffset = (y+1) * width;
                for (let x = 0; x < width; x++) {
                    const nGem = gems[nyOffset + x];
                    const sGem = gems[syOffset + x];
                    nGem.sHalfShard._connectWithOpposite(sGem.nHalfShard);
                }             
            }
        }
        
        // east<->west
        const widthMinusOne = width - 1;
        for (let z = 0; z < depth; z++) {
            const zOffset = z * cornerVerticesArea;
            for (let y = 0; y < height; y++) {
                const yOffset = y * width;
                for (let x = 0; x < widthMinusOne; x++) {
                    const offset = yOffset + x;
                    const wGem = gems[offset];
                    const eGem = gems[offset + 1];
                    wGem.eHalfShard._connectWithOpposite(eGem.wHalfShard);        
                }
            }
        }

        // terminate shards on all boundaries of the grid
        
        if (true) { // top boundary
            const zOffset = 0;
            for (let y = 0; y < height; y++) {
                yOffset = zOffset + y * width;
                for (let x = 0; x < width; x++) {
                    const gem = gems[yOffset + x];
                    gem.uHalfShard._terminateAsBoundary();
                }
            }
        }
        
        if (true) { // bottom boundary
            const zOffset = depthMinusOne * gemArea;
            for (let y = 0; y < height; y++) {
                yOffset = zOffset + y * width;
                for (let x = 0; x < width; x++) {
                    const gem = gems[yOffset + x];
                    gem.dHalfShard._terminateAsBoundary();
                }
            }
        }

        if (true) { // north boundary
            for (let z = 0; z < depth; y++) {
                const zOffset = z * gemArea;
                const yOffset = zOffset + 0 * width;
                for (let x = 0; x < width; x++) {
                    const gem = gems[yOffset + x];
                    gem.nHalfShard._terminateAsBoundary();
                }
            }
        }
        
        if (true) { // south boundary
            const yTerm = heightMinusOne * width;
            for (let z = 0; z < depth; y++) {
                const zOffset = z * gemArea;
                const yOffset = zOffset + yTerm;
                for (let x = 0; x < width; x++) {
                    const gem = gems[yOffset + x];
                    gem.sHalfShard._terminateAsBoundary();
                }
            }
        }
        
        if (true) { // west boundary
            for (let z = 0; z < depth; y++) {
                const zOffset = z * gemArea;
                for (let y = 0; y < height; y++) {
                    const yOffset = zOffset + y * width;
                    const gem = gems[yOffset + 0];
                    gem.wHalfShard._terminateAsBoundary();
                }
            }
        }

        if (true) { // east boundary
            const xTerm = widthMinusOne;
            for (let z = 0; z < depth; y++) {
                const zOffset = z * gemArea;
                for (let y = 0; y < height; y++) {
                    const yOffset = zOffset + y * width;
                    const gem = gems[yOffset + xTerm];
                    gem.eHalfShard._terminateAsBoundary();
                }
            }
        }

        this.cornerVertices = cornerVertices;
        this.centerVertices = centerVertices;
        this.gems = gems;
        this.nwdVertex = cornerVertices[0];
        
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
            const edge = new Edge(startHalfEdge);
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
        }
    }
}

class Vertex {

    constructor(grid, x, y, z) {
        this.grid = grid;
        this.x = x;
        this.y = y;
        this.z = z;
        this.someHalfEdge = null;
    }
    
}

class Gem {
    constructor(grid, x, y, z, unw, une, use, usw, dnw, dne, dse, dsw, center) {
        this.grid = grid;
        
        const nHalfShard = new HalfShard(this, une, dne, dnw, unw, center);
        const eHalfShard = new HalfShard(this, dse, dne, une, use, center);
        const sHalfShard = new HalfShard(this, dsw, dse, use, usw, center);
        const wHalfShard = new HalfShard(this, unw, dnw, dsw, usw, center);
        const uHalfShard = new HalfShard(this, unw, usw, use, une, center);
        const dHalfShard = new HalfShard(this, dse, dsw, dnw, dne, center);
        
        const [nHS_eHF, nHS_dHF, nHS_wHF, nHS_uHF] = nHalfShard._initialSideHalfFaces();
        const [eHS_dHF, eHS_nHF, eHS_uHF, eHS_sHF] = eHalfShard._initialSideHalfFaces();
        const [sHS_dHF, sHS_eHF, sHS_uHF, sHS_wHF] = sHalfShard._initialSideHalfFaces();
        const [wHS_nHF, wHS_dHF, wHS_sHF, wHS_uHF] = wHalfShard._initialSideHalfFaces();
        const [uHS_wHF, uHS_sHF, uHS_eHF, uHS_nHF] = uHalfShard._initialSideHalfFaces();
        const [dHS_sHF, dHS_wHF, dHS_nHF, dHS_eHF] = dHalfShard._initialSideHalfFaces();
        
        nHS_eHF._connectWithOpposite(eHS_nHF);
        nHS_dHF._connectWithOpposite(dHS_nHF);
        nHS_wHF._connectWithOpposite(wHS_nHF);
        nHS_uHF._connectWithOpposite(uHS_nHF);
        
        eHS_dHF._connectWithOpposite(dHS_eHF);
        eHS_nHF._connectWithOpposite(nHS_eHF);
        eHS_uHF._connectWithOpposite(uHS_eHF);
        eHS_sHF._connectWithOpposite(sHS_eHF);
        
        sHS_wHF._connectWithOpposite(wHS_sHF);
        sHS_dHF._connectWithOpposite(dHS_sHF);
        sHS_eHF._connectWithOpposite(eHS_sHF);
        sHS_uHF._connectWithOpposite(uHS_sHF);
       
        wHS_nHF._connectWithOpposite(nHS_wHF);
        wHS_dHF._connectWithOpposite(dHS_wHF);
        wHS_sHF._connectWithOpposite(sHS_wHF);
        wHS_uHF._connectWithOpposite(uHS_wHF);
        
        uHS_wHF._connectWithOpposite(wHS_uHF);
        uHS_sHF._connectWithOpposite(sHS_uHF);
        uHS_eHF._connectWithOpposite(eHS_uHF);
        uHS_nHF._connectWithOpposite(nHS_uHF);
        
        dHS_sHF._connectWithOpposite(sHS_dHF);
        dHS_wHF._connectWithOpposite(wHS_dHF);
        dHS_nHF._connectWithOpposite(nHS_dHF);
        dHS_eHF._connectWithOpposite(eHS_dHF);

        this.nHalfShard = nHalfShard;
        this.eHalfShard = eHalfShard;
        this.sHalfShard = sHalfShard;
        this.wHalfShard = wHalfShard;
        this.uHalfShard = uHalfShard;
        this.dHalfShard = dHalfShard;
    }
}


class HalfShard {
    
    constructor(gem, baseVertex1, baseVertex2, baseVertex3, baseVertex4, topVertex) {
        this.gem = gem;
        this.tetrahedron1 = new Tetrahedron(this, baseVertex1, baseVertex2, baseVertex3, topVertex);
        this.tetrahedron2 = new Tetrahedron(this, baseVertex3, baseVertex4, baseVertex1, topVertex);
        this.oppositeHalfShard = null;
        this.shard = null;
    }

    *_initialBaseHalfEdges() {
        const tetrahedron1 = this.tetrahedron1;
        const baseHalfFace1 = tetrahedron1.baseHalfFace;
        let baseHalfEdge = baseHalfFace1.firstHalfEdge;
        yield baseHalfEdge;
        baseHalfEdge = baseHalfEdge.nextHalfEdge;
        yield baseHalfEdge;
        const tetrahedron2 = this.tetrahedron2;
        const baseHalfFace2 = tetrahedron2.baseHalfFace;
        baseHalfEdge = baseHalfFace2.firstHalfEdge;
        yield baseHalfEdge;
        baseHalfEdge = baseHalfEdge.nextHalfEdge;
        yield baseHalfEdge;
    }
    
    *_initialSideHalfFaces() {
        for (const baseHalfEdge of this._initialBaseHalfEdges()) {
            yield baseHalfEdge.face;
        }
    }

    
    _connectWithOpposite(oppositeHalfShard) {
        const tetrahedron1 = this.tetrahedron1;
        const tetrahedron2 = this.tetrahedron2;
        const baseHalfFace1 = tetrahedron1.baseHalfFace;
        const baseHalfFace2 = tetrahedron1.baseHalfFace;

        const oppositeTetrahedron1 = oppositeHalfShard.tetrahedron1;
        const oppositeTetrahedron2 = oppositeHalfShard.tetrahedron2;
        const oppositeBaseHalfFace1 = oppositeTetrahedron1.baseHalfFace;
        const oppositeBaseHalfFace2 = oppositeTetrahedron2.baseHalfFace;
        
        if (baseHalfFace1._canBeOppositeTo(oppositeBaseHalfFace1)) {
            if (!baseHalfFace2._canBeOppositeTo(oppositeBaseHalfFace2)) {
                throw new Error(`invariant violation: shard base halfFaces don't match`);
            }
            baseHalfFace1._connectWithOpposite(oppositeBaseHalfFace1);
            baseHalfFace2._connectWithOpposite(oppositeBaseHalfFace2);
        } else if (baseHalfFace1._canBeOppositeTo(oppositeBaseHalfFace2)) {
            if (!baseHalfFace2._canBeOppositeTo(oppositeBaseHalfFace1)) {
                throw new Error(`invariant violation: shard base halfFaces don't match`);
            }
            baseHalfFace1._connectWithOpposite(oppositeBaseHalfFace2);
            baseHalfFace2._connectWithOpposite(oppositeBaseHalfFace1);
        }

        this.oppositeHalfShard = oppositeHalfShard;
        oppositeHalfShard.oppositeHalfShard = this;
        
        const shard = new Shard(this);
        this.shard = shard;
        oppositeHalfShard.shard = shard;
    }

    _terminateAsBoundary() {
        const shard = new Shard(this);
        this.shard = shard;        
    }

    _halfEdgeForVertices(sourceVertex, targetVertex) {
        const tetrahedron1 = this.tetrahedron1;
        const baseHalfFace1 = tetrahedron1.baseHalfFace;
        const firstAttemptHalfEdge = baseHalfFace1._halfEdgeForVerticesOrNull(sourceVertex, targetVertex);
        if (firstAttemptHalfEdge !== null) {
            return firstAttemptHalfEdge;
        }
        const tetrahedron2 = this.tetrahedron2;
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
         * Moreover, for a non-convex half-shard that has its corner vertices perturbed but still linearly
         * separated on the grid (like a 3D-chevron shape) there will be one possible well-formed orientation 
         * that properly tetrahedralizes the volume.
         *
         * This is deep surgery: to visualize, draw the two tetrahedrons with their joined quadrilateral 
         * base flat in the center of the page and the 4 exposed triangular side-faces folded outwards 
         * like a four-pointed star.
         *
         * The two faces that are shared between the two tetrahedrons (the ones that are actually
         * being flipped) then need to be drawn flat, separately, and imagined to be sticking up from
         * the page at the diagonal that is to be flipped.
         *
         * Visualizing flat like that is nescesary for understanding this code. First, annotate all
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
        
        const tetrahedron1 = this.tetrahedron1;
        const tetrahedron2 = this.tetrahedron2;
        
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

        baseHalfEdge11.halfFace.halfEdge1 = baseHalfEdge12;
        baseHalfEdge23.halfFace.halfEdge1 = baseHalfEdge24;
        
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
    
    constructor(someHalfShard) {
        this.someHalfShard = someHalfShard;
        this.diagonalEdge = null;
        this.flipped = false;
    }

    setFlipped(flipped) {
		if (flipped !== this.flipped) {
			this.flip();
		}
	}
	
	flip() {
        const halfShard1 = this.someHalfShard;
        halfShard1._flip)();
        const halfShard2 = halfShard1.oppositeHalfShard;
        if (halfShard2 !== null) {
            halfShard2._flip();
        }
        this.flipped = !this.flipped;
    }
    
}

class Tetrahedron {

    constructor(halfShard, baseVertex1, baseVertex2, baseVertex3, topVertex) {
        this.halfShard = halfShard;
        const baseHalfFace = new HalfFace(this, baseVertex1, baseVertex2, baseVertex3);
        const sideHalfFace1 = new HalfFace(this, baseVertex2, baseVertex1, topVertex);
        const sideHalfFace2 = new HalfFace(this, baseVertex3, baseVertex2, topVertex);
        const sideHalfFace3 = new HalfFace(this, baseVertex1, baseVertex3, topVertex);
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
        this.baseHalfFace = baseHalfFace;
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
    
    _halfFaceForVertices(vertexA, vertexB, vertexC) {
        for (const halfFace of this.halfFaces()) {
            if (halfFace._matchesVertices(vertexA, vertexB, vertexC)) {
                return halfFace;
            }
        }
        throw new Error(`invariant violation: no halfFace matching given vertices`);
    }
}

class HalfFace {

    constructor(tetrahedron, vertex1, vertex2, vertex3) {
        this.tetrahedron = tetrahedron;
        const halfEdge1 = new HalfEdge(this, vertex1);
        const halfEdge2 = new HalfEdge(this, vertex2);
        const halfEdge2 = new HalfEdge(this, vertex3);
        halfEdge1.nextHalfEdge = halfEdge2;
        halfEdge2.nextHalfEdge = halfEdge3;
        halfEdge3.nextHalfEdge = halfEdge1;
        this.halfEdge1 = halfEdge1;
        this.face = null;
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
    
    _connectWithOpposite(oppositeHalfFace) {
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
        const face = new Face(this);
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

    constructor(someHalfFace) {
        this.someHalfFace = someHalfFace;
    }
    
}

class HalfEdge {

    constructor(halfFace, sourceVertex) {
        this.halfFace = halfFace;
        this.sourceVertex = sourceVertex; 
        this.nextHalfEdge = null;
        this.neighbourHalfEdge = null;
        this.oppositeHalfEdge = null;
        this.edge = null;
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
        const edge = new Edge(this);
        if (this.edge !== null) {
            throw new Error(`invariant violation: edge set twice`);
        }
        this.edge = edge;
        if (oppositeHalfEdge.edge !== null) {
            throw new Error(`invariant violation: edge set twice`);
        }
        oppositeHalfEdge.edge = edge;
    }
}

class Edge {

    constructor(startHalfEdge) {
        this.startHalfEdge = startHalfEdge; // chosen so that the iterator below is exhaustive
    }

    *halfEdges() {
        const startHalfEdge = this.startHalfEdge;
        let currHalfEdge = startHalfEdge;
        do {
            yield currHalfEdge;
            const neighbourHalfEdge = currHalfEdge.neighbour;
            yield neighbourHalfEdge;
            currHalfEdge = neighbourHalfEdge.oppositeHalfEdge;
        } while (currHalfEdge !== null && currHalfEdge !== startHalfEdge)
    }
}