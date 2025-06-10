export class ReliefGrid {

    /**
	 * A relief grid is a 2.5 dimensional mesh that is a perturbed
	 * grid in the sense that, topologically, it's a strict rectangular grid
	 * but, locally, in the x- and y-direction, vertices are allowed some 
	 * finite amount of deviation from their grid position. In the z-direction
	 * any amount of deviation is allowed (that's why it's suitable as a 
	 * representation for a relief).
	 *
	 * @param {width} The number of grid tiles in the x direction.
	 * @param {height} - The number of grid tiles in the y direction.
	 * @param {tileSize} - The base size of each square tile. The allowed 
	 *   deviation is an epsilon amount less than half a tileSize such that
	 *   moving the vertices by that amount can never throw off the 
	 *   orientation tests. This keeps the mesh representation robust.
	 *   By keeping each vertex close to its base position, the perturbed 
	 *   mesh will remain topologically equivalent to the base grid.
	 *   This, in turn, greatly simplifies (and speeds up) things like point
	 *   location and incremental updates.
	 */
    constructor (halfWidth, halfHeight, tileSize) {
		this.halfWidth = halfWidth;
		this.halfHeight = halfHeight;
		const width = halfWidth * 2;
		const height = halfHeight * 2;
        this.width = width;
		this.height = height;
		this.tileSize = tileSize;
		const widthPlusOne = width + 1;
		const heightPlusOne = height + 1;
		// create vertices
		const numberOfVertices = heightPlusOne * widthPlusOne;
		const vertices = new Array(numberOfVertices);
		let vertexIdx = 0;
		const yOffset = -halfHeight * tileSize;
		const xOffset = -halfHeight * tileSize;
		for (let v = 0; v < heightPlusOne; v++) {
			const y = yOffset + v * tileSize;
			for (let h = 0; h < widthPlusOne; h++) {
				const x = xOffset + v * tileSize;
				const vertex = new ReliefVertex(this, vertexIdx, [h, v], [x, y])
				vertices[vertexIdx] = vertex;
				vertexIdx++;
			}
		}
		this.vertices = vertices;
		// create shards
		console.log("creating shards:");
		const numberOfShards = height * width;
		const shards = new Array(numberOfShards);
		let shardIdx = 0;
		let nwVertexIdx = 0;
		let neVertexIdx = 1;
		let seVertexIdx = widthPlusOne;
		let swVertexIdx = width;
		for (let v = 0; v < height; v++) {
			for (let h = 0; h < width; h++) {
				const nwVertex = vertices[nwVertexIdx];
				const neVertex = vertices[neVertexIdx];
				const seVertex = vertices[seVertexIdx];
				const swVertex = vertices[swVertexIdx];
				console.log(`[${h}, ${v}]`);
				const shard = new ReliefShard(this, shardIdx, [h, v], [nwVertex, neVertex, seVertex, swVertex]);
				shards[shardIdx] = shard;
				shardIdx++;
				nwVertexIdx++;
				neVertexIdx++;
				seVertexIdx++;
				swVertexIdx++;
			}
			nwVertexIdx++;
			neVertexIdx++;
			seVertexIdx++;
			swVertexIdx++;
		}
		this.shards = shards;
		// create faces and diagonals
		const numberOfFaces = numberOfShards * 2;
		const faces = new Array(numberOfFaces);
		const numberOfHalfEdges = numberOfFaces * 3;
		const halfEdges = new Array(numberOfHalfEdges);
		const numberOfDiagonals = numberOfShards;
		const numberOfHorizontals = width * heightPlusOne;
		const numberOfVerticals = height * widthPlusOne;
		const numberOfEdges = numberOfDiagonals + numberOfHorizontals + numberOfVerticals;
		const edges = new Array(numberOfEdges);
		let faceIdx = 0;
		let halfEdgeIdx = 0;
		let edgeIdx = 0;
		for (let shard of shards) {
			console.log(`${shard}`);
			const { nwVertex, neVertex, seVertex, swVertex } = shard;
			/*
			 *     nw-------ne
			 *      |  \    |
			 *      | 2 \ 1 |
			 *      |    \  |
			 *     sw-------se
			 */
			// anticlockwise winding order
			const firstFace = new ReliefFace(shard, faceIdx); 
			faces[faceIdx] = firstFace;
			faceIdx++;
			const he11 = new ReliefHalfEdge(halfEdgeIdx, firstFace, [nwVertex, seVertex]);
			halfEdges[halfEdgeIdx] = he11;
			halfEdgeIdx++;
			const he12 = new ReliefHalfEdge(halfEdgeIdx, firstFace, [seVertex, neVertex]);
			halfEdges[halfEdgeIdx] = he12;
			halfEdgeIdx++;
			const he13 = new ReliefHalfEdge(halfEdgeIdx, firstFace, [neVertex, nwVertex]);
			halfEdges[halfEdgeIdx] = he13;	
			halfEdgeIdx++;
			he11.nextHalfEdge = he12;
			he12.nextHalfEdge = he13;
			he13.nextHalfEdge = he11;
			const secondFace = new ReliefFace(shard, faceIdx);
			faces[faceIdx] = secondFace;
			faceIdx++;
			const he21 = new ReliefHalfEdge(halfEdgeIdx, secondFace, [nwVertex, swVertex]);
			halfEdges[halfEdgeIdx] = he21;
			halfEdgeIdx++;
			const he22 = new ReliefHalfEdge(halfEdgeIdx, secondFace, [swVertex, seVertex]);
			halfEdges[halfEdgeIdx] = he22;
			halfEdgeIdx++;
			const he23 = new ReliefHalfEdge(halfEdgeIdx, secondFace, [seVertex, nwVertex]);
			halfEdges[halfEdgeIdx] = he23;
			halfEdgeIdx++;
			he21.nextHalfEdge = he22;
			he22.nextHalfEdge = he23;
			he23.nextHalfEdge = he21;
			he11.oppositeHalfEdge = he23;
			he23.oppositeHalfEdge = he11;
			firstFace.diagonalHalfEdge = he11;
			secondFace.diagonalHalfEdge = he23;
			const diagonalEdge = new ReliefEdge(edgeIdx, he11, true);
			edges[edgeIdx] = diagonalEdge;
			edgeIdx++;
			he11.edge = diagonalEdge;
			he13.edge = diagonalEdge;
			shard.firstFace = firstFace;
			shard.secondFace = secondFace;
		}
		// go over the horizontal edges and connect them up
		for (let h = 0; h < width; h++) {
			const shard = shards[h];
			const halfEdge = shard.firstFace.diagonalHalfEdge.nextHalfEdge.nextHalfEdge;
			const edge = new ReliefEdge(edgeIdx, halfEdge, false);
			edges[edgeIdx] = edge;
			edgeIdx++;
			halfEdge.edge = edge;
		}
		let shardIdxOffsetAbove = 0;
		let shardIdxOffsetBelow = width;
		for (let v = 1; v < height; v++) {
			for (let h = 0; h < width; h++) {
				const shardAbove = shards[shardIdxOffsetAbove + h];
				const shardBelow = shards[shardIdxOffsetBelow + h];
				const halfEdgeAbove = shardAbove.secondFace.diagonalHalfEdge.nextHalfEdge.nextHalfEdge;
				const halfEdgeBelow = shardBelow.firstFace.diagonalHalfEdge.nextHalfEdge.nextHalfEdge;
				halfEdgeAbove.oppositeHalfEdge = halfEdgeBelow;
				halfEdgeBelow.oppositeHalfEdge = halfEdgeAbove;
				const edge = new ReliefEdge(edgeIdx, halfEdgeAbove, false);
				edges[edgeIdx] = edge;
				edgeIdx++;
				halfEdgeAbove.edge = edge;
				halfEdgeBelow.edge = edge;
			}
			shardIdxOffsetAbove = shardIdxOffsetBelow;
			shardIdxOffsetBelow += width;
		}
		const shardIdxOffsetBottom = (height-1) * width;
		for (let h = 0; h < width; h++) {
			const shard = shards[shardIdxOffsetBottom + h];
			const halfEdge = shard.secondFace.diagonalHalfEdge.nextHalfEdge.nextHalfEdge;
			const edge = new ReliefEdge(edgeIdx, halfEdge, false);
			edges[edgeIdx] = edge;
			edgeIdx++;
			halfEdge.edge = edge;
		}
		// go over the vertical edges and connect them up
		let leftMostShardIdx = 0;
		for (let v = 0; v < height; v++) {
			const leftMostShard = shards[leftMostShardIdx];
			leftMostShardIdx += width;
			const leftMostHalfEdge = leftMostShard.secondFace.diagonalHalfEdge.nextHalfEdge;
			const leftMostEdge = new ReliefEdge(edgeIdx, leftMostHalfEdge, false);
			edges[edgeIdx] = leftMostEdge;
			edgeIdx++;
			leftMostHalfEdge.edge = leftMostEdge;
		}
		for (let h = 1; h < width; h++) {
			let shardIdxLeft = h-1;
			let shardIdxRight = h;
			for (let v = 0; v < height; v++) {
				const leftShard = shards[shardIdxLeft];
				shardIdxLeft += width;
				const rightShard = shards[shardIdxRight];
				shardIdxRight += width;
				const leftHalfEdge = leftShard.firstFace.diagonalHalfEdge.nextHalfEdge;
				const rightHalfEdge = rightShard.secondFace.diagonalHalfEdge.nextHalfEdge;
				leftHalfEdge.oppositeHalfEdge = rightHalfEdge;
				rightHalfEdge.oppositeHalfEdge = leftHalfEdge;
				const edge = new ReliefEdge(edgeIdx, leftHalfEdge, false);
				edges[edgeIdx] = edge;
				edgeIdx++;
				leftHalfEdge.edge = edge;
				rightHalfEdge.edge = edge;
			}
		}
		let rightMostShardIdx = width-1;
		for (let v = 0; v < height; v++) {
			const rightMostShard = shards[rightMostShardIdx];
			rightMostShardIdx += width;
			const rightMostHalfEdge = rightMostShard.firstFace.diagonalHalfEdge.nextHalfEdge;
			const rightMostEdge = new ReliefEdge(edgeIdx, rightMostHalfEdge, false);
			edges[edgeIdx] = rightMostEdge;
			edgeIdx++;
			rightMostHalfEdge.edge = rightMostEdge;
		}
		this.faces = faces;
		this.edges = edges;
		this.halfEdges = halfEdges;
		// connect vertices to outgoing halfEdges
		let currShardIdx = 0;
		for (let v = 0; v < height; v++) {
			for (let h = 0; h < width; h++) {
				const shard = shards[currShardIdx];
				currShardIdx++;
				if (v === 0) {
					shard.nwVertex.firstIncomingHalfEdge = 
						shard.firstFace.diagonalHalfEdge.nextHalfEdge.nextHalfEdge;
					shard.swVertex.firstIncomingHalfEdge =
						shard.secondFace.diagonalHalfEdge.nextHalfEdge;
					if (h === width-1) {
						shard.neVertex.firstIncomingHalfEdge = 
							shard.firstFace.diagonalHalfEdge.nextHalfEdge;
					}
				} else {
					if (h === width-1) {
						shard.neVertex.firstIncomingHalfEdge =
							shard.firstFace.diagonalHalfEdge.nextHalfEdge;
						if (v === height-1) {
							shard.seVertex.firstIncomingHalfEdge
								shard.secondFace.diagonalHalfEdge.nextHalfEdge.nextHalfEdge;
						}
					}
					shard.swVertex.firstIncomingHalfEdge = 
						shard.secondFace.diagonalHalfEdge.nextHalfEdge;
				}
			}
		}
	}

	/**
	 * Returns the tile location and ...
	 */
	locateShard([x, y]) {
		// TODO	
	}

	dump(outputLine, indent) {
		const nextIndent = indent + "    ";
		outputLine(indent + "ReliefMesh {");
		outputLine(indent + "  vertices: [");
		for (const vertex of this.vertices) {
			vertex.dump(outputLine, nextIndent);
		}
		outputLine(indent + "  ],")
		outputLine(indent + "  shards: [");
		for (const shard of this.shards) {
			shard.dump(outputLine, nextIndent);
		}
		outputLine(indent + "  ],");
		outputLine(indent + "  faces: [");
		for (const face of this.faces) {
			face.dump(outputLine, nextIndent);
		}
		outputLine(indent + "  ],")
		outputLine(indent + "  halfEdges: [");
		for (const halfEdge of this.halfEdges) {
			halfEdge.dump(outputLine, nextIndent);
		}
		outputLine(indent + "  ],")
		outputLine(indent + "  edges: [");
		for (const edge of this.edges) {
			edge.dump(outputLine, nextIndent);
		}
		outputLine(indent + "  ],")
		outputLine(indent + "}");
	}
}

export class ReliefShard {

	/**
	 * A ReliefShard represents a single perturbed tile in a ReliefGrid. It either
	 * consists of a single quadrilateral, when the four corner vertices are
	 * co-planar, or a "butterfly" consisting of two triangular subfaces that share
	 * a diagonal edge. In the latter configuration the shard can be in two possible 
	 * modes depending on the orientation of the diagonal edge, i.e.: 
	 * northwest-southeast (unflipped mode) or northeast-southwest (flipped mode).
	 */
	constructor(grid, idx, [h, v], [nwVertex, neVertex, seVertex, swVertex], flipped) {
		this.grid = grid;
		this.idx = idx;
		this.h = h;
		this.v = v;
		this.nwVertex = nwVertex;
		this.neVertex = neVertex;
		this.seVertex = seVertex;
		this.swVertex = swVertex;
		this.flipped = false;
		this.firstFace = null;
		this.secondFace = null;
	}

	dump(outputLine, indent) {
		outputLine(indent + `ReliefShard{ idx: ${this.idx}, [h, v]: [${this.h}, ${this.v}], [nwV, neV, seV, swV]: [${this.nwVertex.idx}, ${this.neVertex.idx}, ${this.seVertex.idx}, ${this.swVertex.idx}], flipped: ${this.flipped}, firstFace: ${this?.firstFace.idx}, secondFace: ${this.secondFace?.idx} }`);
	}
}

export class ReliefFace {

	/**
	 * A ReliefFace represents a single perturbed, triangular face in a 
	 * ReliefGrid. It is always part of exactly one ReliefShard.
	 */
	constructor(shard, idx) {
		this.shard = shard;
		this.idx = idx;
		this.diagonalHalfEdge = null;
	}

	dump(outputLine, indent) {
		outputLine(indent + `ReliefFace{ idx: ${this.idx}, shard: ${this.shard.idx}, diagonalHalfEdge: ${this.diagonalHalfEdge?.idx}}`);
	}
}

export class ReliefVertex {

	/**
	 * A relief vertex represents a single perturbed vertex in a ReliefGrid.
	 * It is always part of at least one, and at most four, ReliefShards, 
	 * and, through that, it is alway part of at least one and at most eight 
	 * ReliefFaces.
	 */
	constructor(grid, idx, [h, v], [baseX, baseY]) {
		this.grid = grid;
		this.idx = idx;
		this.h = h;
		this.v = v;
		this.baseX = baseX;
		this.baseY = baseY;
		this.firstIncomingHalfEdge = null;
	}

	dump(outputLine, indent) {
		outputLine(indent + `ReliefVertex{ idx: ${this.idx}, [h, v]: [${this.h}, ${this.v}], [baseX, baseY]: [${this.baseX}, ${this.baseY}], firstIncomingHalfEdge: ${this.firstIncomingHalfEdge?.idx}}`);
	}
}

export class ReliefEdge {

	/**
	 * A ReliefEdge is an undirected edge associated to 1 or 2 ReliefFaces.
	 * If it's associated to 1 ReliefFace it's a border of the mesh as-a-whole,
	 * if it's associated to 2 ReliefFace's it's an internal edge of the
	 * Mesh as-a-whole.
	 */
	constructor(idx, someHalfEdge, isDiagonal) {
		this.idx = idx;
		this.someHalfEdge = someHalfEdge;
		this.isDiagonal = isDiagonal;
	}

	dump(outputLine, indent) {
		outputLine(indent + `ReliefEdge{ idx: ${this.idx}, someHalfEdge: [${this.someHalfEdge?.idx}, isDiagonal: ${this.isDiagonal}}`);
	}
}

export class ReliefHalfEdge {

	/**
	 * A ReliefHalfEdge is a directed edge associated to 1 ReliefFace.
	 * It also stores the normal for the targetVertex of the associated
	 * face (note that a single vertex will have multiple adjacent faces
	 * and each will have its own normal associated to that vertex)
	 */
	constructor(idx, reliefFace, [sourceVertex, targetVertex]) {
		this.idx = idx;
		this.face = reliefFace;
		this.sourceVertex = sourceVertex;
		this.targetVertex = targetVertex;
		this.targetVertexFaceNormal = [0, 0, 1];
		this.nextHalfEdge = null;
		this.oppositeHalfEdge = null;
		this.edge = null;
	}
	
	dump(outputLine, indent) {
		outputLine(indent + `ReliefHalfEdge{ idx: ${this.idx}, face: [${this.face.idx}, sourceVertex: ${this.sourceVertex.idx}, targetVertex: ${this.targetVertex.idx}, targetVertexFaceNormal: ${JSON.stringify(this.targetVertexFaceNormal)}, nextHalfEdge: ${this.nextHalfEdge?.idx}, oppositeHalfEdge: ${this.oppositeHalfEdge?.idx}, edge: ${this.edge?.idx}}`);
	}
}
