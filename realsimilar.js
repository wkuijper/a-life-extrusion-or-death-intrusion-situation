class FloatTree {
    
    constructor() {
        this.__rootNode = new FloatTreeNode();
        this.__firstFreeNode = null;
    }

    _freeNode(node) {
        if (node._parent === null) {
            throw new Error(`invariant violation`);
        }
        if (node._zeroChild !== null) {
            throw new Error(`invariant violation`);
        }    
        if (node._oneChild !== null) {
            throw new Error(`invariant violation`);
        }    
        if (node._posRefCount !== 0) {
            throw new Error(`invariant violation`);
        }    
        if (node._negRefCount !== 0) {
            throw new Error(`invariant violation`);
        }     
        if (node._posObj !== null) {
            throw new Error(`invariant violation`);
        } 
        if (node._negObj !== null) {
            throw new Error(`invariant violation`);
        }
        node._parent = null;
        node._lvl = 0;
        if (this.__firstFreeNode !== null) {
            node._oneChild = this.__firstFreeNode;
            this.__firstFreeNode = node;
        }
    }

    _newNode() {
        if (this.__firstFreeNode !== null) {
            const newNode = this.__firstFreeNode;
            this.__firstFreeNode = newNode._oneNode;
            return newNode;
        } else {
            return new FloatTreeNode();
        }
    }
    
    _incPosRefCount(node) {
        let currNode = node;
        do {
            currNode._posRefCount++;
            currNode = currNode._parent;
        } while (currNode !== null);
    }
    
    _incNegRefCount(node) {
        let currNode = node;
        do {
            currNode._negRefCount++;
            currNode = currNode._parent;
        } while (currNode !== null);
    }

    _decPosRefCount(node) {
        let currNode = node;
        do {
            if (currNode._posRefCount < 1) {
                throw new Error(`invariant violation`);
            }            
            currNode._posRefCount--;
            const parentNode = currNode.parent;
            if (currNode._parent !== null
                && currNode._negRefCount === 0 
                && currNode._posRefCount === 0) {
                this._freeNode(currNode);
            }
            currNode = parentNode;
        } while (currNode !== null);
    }
    
    _decNegRefCount(node) {
        let currNode = node;
        do {
            if (currNode._negRefCount < 1) {
                throw new Error(`invariant violation`);
            }
            currNode._negRefCount--;
            const parentNode = currNode.parent;
            if (currNode._parent !== null 
                && currNode._negRefCount === 0 
                && currNode._posRefCount === 0) {
                this._freeNode(currNode);
            }
            currNode = parentNode;
        } while (currNode !== null);
    }

    _parent(node) {
        if (node._parent === null) {
            const oldRoot = node;
            const newRoot = this._newNode();
            newRoot._lvl = oldRoot._lvl + 1;
            newRoot._zeroChild = oldRoot;
            newRoot._posRefCount = oldRoot._posRefCount;
            newRoot._negRefCount = oldRoot._negRefCount;
            oldRoot._parent = newRoot;
            this.__rootNode = newRoot;
        }
        return node._parent;
    }
}

class FloatTreeNode {

    constructor() {
        this._lvl = 0;
        this._parent = null;
        this._zeroChild = null;
        this._oneChild = null;
        this._posObj = null;
        this._negObj = null;
        this._posRefCount = 0;
        this._negRefCount = 0;
    }

}

class FloatTreeHandle {

    get level() {
        return this.__node._lvl;
    }
    
    constructor(tree, node) {
        this.__tree = tree;
        this.__node = node;
        node.incRefCount();
    }

    levelUp(lvl) {
        if (lvl === undefined) {
            lvl = node._lvl + 1;
        }
        let node = this.__node;
        while (node._lvl < lvl) {
            const nextNode = tree._parent(node);
            nextNode.incRefCount();
            node = nextNode;
        }
        this.__node = node;
    }

    appendZero() {
        
    }
    
}