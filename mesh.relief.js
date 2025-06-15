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
    constructor(width, height, tileSize) {
		this.width = width;
		this.height = height;
		this.tileSize = tileSize;
		this.maxAllowedShift = .4999 * tileSize;
		const widthPlusOne = width + 1;
		const heightPlusOne = height + 1;
		this.widthPlusOne = widthPlusOne;
		this.heightPlusOne = heightPlusOne;
		// create vertices
		const numberOfVertices = heightPlusOne * widthPlusOne;
		const vertices = new Array(numberOfVertices);
		let vertexIdx = 0;
		for (let v = 0; v < heightPlusOne; v++) {
			const y = v * tileSize;
			for (let h = 0; h < widthPlusOne; h++) {
				const x = h * tileSize;
				const vertex = new ReliefVertex(this, vertexIdx, [h, v], [x, y])
				vertices[vertexIdx] = vertex;
				vertexIdx++;
			}
		}
		this.vertices = vertices;
		// create shards
		const numberOfShards = height * width;
		const shards = new Array(numberOfShards);
		let shardIdx = 0;
		let nwVertexIdx = 0;
		let neVertexIdx = 1;
		let seVertexIdx = widthPlusOne+1;
		let swVertexIdx = widthPlusOne;
		for (let v = 0; v < height; v++) {
			for (let h = 0; h < width; h++) {
				const nwVertex = vertices[nwVertexIdx];
				const neVertex = vertices[neVertexIdx];
				const seVertex = vertices[seVertexIdx];
				const swVertex = vertices[swVertexIdx];
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
			he23.edge = diagonalEdge;
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
				} 
				if (h === width-1) {
					shard.neVertex.firstIncomingHalfEdge =
						shard.firstFace.diagonalHalfEdge.nextHalfEdge;
				}
				if (v > 0 || height === 1) {
					if (h === 0) {
						shard.swVertex.firstIncomingHalfEdge = 
							shard.secondFace.diagonalHalfEdge.nextHalfEdge;
					}
					shard.seVertex.firstIncomingHalfEdge =
						shard.secondFace.diagonalHalfEdge.nextHalfEdge.nextHalfEdge;
				}
			}
		}
		// set up change listener infrastructure
		this.changeListeners = [];
		this.changedVertices = [];
		this.changedFaces = [];
	}

	/**
	 * Returns a face that intersects the vertical through [x, y]
	 * or null in case the coordinate is out of bounds for the mesh.
	 */
	locateFaceForVertical([x, y]) {
		const h = Math.floor(x / this.tileSize);
		const v = Math.floor(y / this.tileSize);
		if (h < -1
		    || h > this.widthPlusOne
		    || v < -1
		    || v > this.heightPlusOne) {
			return null;			
		}
		const width = this.width;
		const height = this.height;
		const shards = this.shards;
		for (let dv = -1; dv <= 1; dv++) {
			const vv = v + dv;
			if (vv < 0 || vv >= height) {
				continue;
			}
			const vvOffset = vv * width;
			for (let dh = -1; dh <= 1; dh++) {
				const hh = h + dh;
				if (hh < 0 || hh >= width) {
					continue;
				}
				const shard = shards[vvOffset + hh];
				for (const face of shard.faces()) {
					const he0 = face.diagonalHalfEdge;
					const he1 = he0.nextHalfEdge;
					const he2 = he1.nextHalfEdge;
					const [x0, y0, _z0] = he0.sourceVertex.getShiftedPosition();
					const [x1, y1, _z1] = he1.sourceVertex.getShiftedPosition();
					const [x2, y2, _z2] = he2.sourceVertex.getShiftedPosition();
					console.log(`[${x}, ${y}] checking: [${x0}, ${y0}] -> [${x1}, ${y1}] -> [${x2}, ${y2}]`);
					if (face.intersectsVertical([x, y])) {
						console.log("match!");
						return face;
					}
				}
			}
		}
		return null;
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

	dumpGraphviz(outputLine, indent) {
		const nextIndent = indent + "    ";
		outputLine(indent + `digraph "ReliefMesh" {`);
		for (const vertex of this.vertices) {
			vertex.dumpGraphviz(outputLine, nextIndent);
		}
		for (const face of this.faces) {
			face.dumpGraphviz(outputLine, nextIndent);
		}
		for (const halfEdge of this.halfEdges) {
			halfEdge.dumpGraphviz(outputLine, nextIndent);
		}
		for (const vertex of this.vertices) {
			const firstIncomingHalfEdge = vertex.firstIncomingHalfEdge;
			if (firstIncomingHalfEdge !== null) {
				outputLine(nextIndent + `v${vertex.idx} -> h${firstIncomingHalfEdge.idx} [label="f"];`);
			}
		}
		for (const face of this.faces) {
			const diagonalHalfEdge = face.diagonalHalfEdge;
			if (diagonalHalfEdge !== null) {
				outputLine(nextIndent + `f${face.idx} -> h${diagonalHalfEdge.idx} [label="d"];`);
			}
		}
		for (const halfEdge of this.halfEdges) {
			const nextHalfEdge = halfEdge.nextHalfEdge;
			if (nextHalfEdge !== null) {
				outputLine(nextIndent + `h${halfEdge.idx} -> h${nextHalfEdge.idx} [label="n"];`);
			}
			const oppositeHalfEdge = halfEdge.oppositeHalfEdge;
			if (oppositeHalfEdge !== null) {
				outputLine(nextIndent + `h${halfEdge.idx} -> h${oppositeHalfEdge.idx} [label="o"];`);
			}
			const face = halfEdge.face;
			if (face !== null) {
				outputLine(nextIndent + `h${halfEdge.idx} -> f${face.idx} [label="f"];`);
			}
		}
		outputLine(indent + "}");
	}

	notifyChangeListeners() {
		const changeEvent = {
			changedFaceVertices: this.changedFaceVertices,
			changedFaceIndices: this.changedFaceIndices,
			changedFaceNormals: this.changedFaceNormals,
		}
		for (const changeListener of changeListeners) {
			changeListener(changeEvent);
		}
		this.changedVertices.length = 0;
		this.changedFaceIndices.length = 0;
		this.changedFaceNormals.length = 0;
	}

	boundingBox() {
		let [minX, minY] = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
		let [maxX, maxY] = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
		for (const vertex of this.vertices) {
			const [x, y] = vertex.getShiftedPosition();
			if (x < minX) {
				minX = x;
			}
			if (x > maxX) {
				maxX = x;
			}
			if (y < minY) {
				minY = y;
			}
			if (y > maxY) {
				maxY = y;
			}
		}
		return [minX, minY, maxX, maxY];
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

	setFlipped(flipped) {
		if (flipped !== this.flipped) {
			this.flip();
		}
	}
	
	flip() {
		if (!this.flipped) {
			const firstFace = this.firstFace;
			const secondFace = this.secondFace;
			
			const he11 = firstFace.diagonalHalfEdge;
			const he12 = he11.nextHalfEdge;
			const he13 = he12.nextHalfEdge;
			const he23 = secondFace.diagonalHalfEdge;
			const he21 = he23.nextHalfEdge;
			const he22 = he21.nextHalfEdge;

			const nw = he23.targetVertex;
			const se = he11.targetVertex;
			const sw = he21.targetVertex;
			const ne = he12.targetVertex;
			
			he11.sourceVertex = sw;
			he11.targetVertex = ne;
			he23.sourceVertex = ne;
			he23.targetVertex = sw;
				
			he21.face = firstFace;
			he12.face = secondFace;

			he11.nextHalfEdge = he13;
			he13.nextHalfEdge = he21;
			he21.nextHalfEdge = he11;

			he23.nextHalfEdge = he22;
			he22.nextHalfEdge = he12;
			he12.nextHalfEdge = he23;

			this.flipped = true;
		} else {
			const firstFace = this.firstFace;
			const secondFace = this.secondFace;
			
			const he11 = firstFace.diagonalHalfEdge;
			const he13 = he11.nextHalfEdge;
			const he21 = he13.nextHalfEdge;
			const he23 = secondFace.diagonalHalfEdge;
			const he22 = he23.nextHalfEdge;
			const he12 = he22.nextHalfEdge;

			he12.face = firstFace;
			he21.face = secondFace;

			he11.nextHalfEdge = he12;
			he12.nextHalfEdge = he13;
			he13.nextHalfEdge = he11;

			he23.nextHalfEdge = he21;
			he21.nextHalfEdge = he22;
			he22.nextHalfEdge = he23;
			
			this.flipped = false;
		}
	}

	*faces() {
		yield this.firstFace;
		yield this.secondFace;
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
		outputLine(indent + `ReliefFace{ idx: ${this.idx}, shard: ${this.shard.idx}, diagonalHalfEdge: ${this.diagonalHalfEdge?.idx} }`);
	}
	
	dumpGraphviz(outputLine, indent) {
		outputLine(indent + `f${this.idx} [label="${this.idx}", shape="triangle"];`);
	}

	intersectsVertical([x, y]) {
		let halfEdge = this.diagonalHalfEdge;
		if (!halfEdge.rightOfOrOnVertical([x, y])) {
			return false;
		}
		halfEdge = halfEdge.nextHalfEdge;
		if (!halfEdge.rightOfOrOnVertical([x, y])) {
			return false;
		}
		halfEdge = halfEdge.nextHalfEdge;
		if (!halfEdge.rightOfOrOnVertical([x, y])) {
			return false;
		}
		return true;
	}

	getHalfEdges() {
		const he1 = this.diagonalHalfEdge;
		const he2 = he1.nextHalfEdge;
		const he3 = he2.nextHalfEdge;
		return [he1, he2, he3];
	}
	
	getVertices() {
		const [he1, he2, he3] = this.getHalfEdges();
		return [he1.targetVertex, he2.targetVertex, he3.targetVertex];
	}
	
	getShiftedPositions() {
		const [v1, v2, v3] = this.getVertices();
		return [v1.getShiftedPosition(), v2.getShiftedPosition(), v3.getShiftedPosition()];
	}

	getShiftedMedianPosition() {
		const [[x1, y1, z1], [x2, y2, z2], [x3, y3, z3]] = this.getShiftedPositions();
		return [(x1 + x2 + x3) / 3, (y1 + y2 + y3) / 3, (z1 + z2 + z3) / 3];
	}
}

export class ReliefVertex {

	/**
	 * A relief vertex represents a single, shifted vertex in a ReliefGrid.
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
		this.shiftX = 0;
		this.shiftY = 0;
		this.shiftZ = 0;
		this.shiftedX = baseX;
		this.shiftedY = baseY;
		this.shiftedZ = 0;
		this.firstIncomingHalfEdge = null; // invariant: this halfedge will never be a diagonal
		this.inChangedList = false;
	}

	dump(outputLine, indent) {
		const incomingHalfEdgeIdxs = [];
		for (const incomingHalfEdge of this.incomingHalfEdges()) {
			incomingHalfEdgeIdxs.push(incomingHalfEdge.idx);
		}
		outputLine(indent + `ReliefVertex{ idx: ${this.idx}, [h, v]: [${this.h}, ${this.v}], [baseX, baseY]: [${this.baseX}, ${this.baseY}], firstIncomingHalfEdge: ${this.firstIncomingHalfEdge?.idx}, incomingHalfEdges: ${JSON.stringify(incomingHalfEdgeIdxs)} }`);
	}

	dumpGraphviz(outputLine, indent) {
		outputLine(indent + `v${this.idx} [label="${this.idx}", shape="circle"];`);
	}

	*incomingHalfEdges() {
		if (this.firstIncomingHalfEdge === null) {
			// special case: empty mesh
			return;
		}
		const firstIncomingHalfEdge = this.firstIncomingHalfEdge;
		let incomingHalfEdge = firstIncomingHalfEdge;
		do {
			yield incomingHalfEdge;
			incomingHalfEdge = incomingHalfEdge.nextHalfEdge.oppositeHalfEdge;
		} while (incomingHalfEdge !== null && incomingHalfEdge !== firstIncomingHalfEdge);
	}

	getShiftedPosition() {
		return [this.shiftedX, this.shiftedY, this.shiftedZ];
	}

	setShift([shiftX, shiftY, shiftZ]) {
		const maxAllowedShift = this.grid.maxAllowedShift;
		if (shiftX < -maxAllowedShift ||
			   shiftX > maxAllowedShift ||
			   shiftY < -maxAllowedShift ||
			   shiftY > maxAllowedShift ) {
			throw new Error("maximal allowed shift exceeded");
		}
		if (this.shiftX !== shiftX) {
			this.shiftX = shiftX;
			this.reportAsChanged();
		}
		if (this.shiftY !== shiftY) {
			this.shiftY = shiftY;
			this.reportAsChanged();
		}
		if (this.shiftZ !== shiftZ) {
			this.shiftZ = shiftZ;
			this.reportAsChanged();
		}
		this.shiftedX = this.baseX + shiftX;
		this.shiftedY = this.baseY + shiftY;
		this.shiftedZ = shiftZ;
	}

	reportAsChanged() {
		if (this.inChangedList) {
			return;
		}
		this.grid.changedVertices.push(this);
		this.inChangedList = true;
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
		outputLine(indent + `ReliefEdge{ idx: ${this.idx}, someHalfEdge: ${this.someHalfEdge?.idx}, isDiagonal: ${this.isDiagonal} }`);
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
		outputLine(indent + `ReliefHalfEdge{ idx: ${this.idx}, face: [${this.face.idx}, sourceVertex: ${this.sourceVertex.idx}, targetVertex: ${this.targetVertex.idx}, targetVertexFaceNormal: ${JSON.stringify(this.targetVertexFaceNormal)}, nextHalfEdge: ${this.nextHalfEdge?.idx}, oppositeHalfEdge: ${this.oppositeHalfEdge?.idx}, edge: ${this.edge?.idx} }`);
	}
	
	dumpGraphviz(outputLine, indent) {
		outputLine(indent + `h${this.idx} [label="${this.idx}", shape="box"];`);
	}

	rightOfOrOnVertical([x, y]) {
		const [sx, sy, _sz] = this.sourceVertex.getShiftedPosition();
		const [tx, ty, _tz] = this.targetVertex.getShiftedPosition();
		return (tx - sx) * (y - sy) - (ty - sy) * (x - sx) <= 0;
	}
}
