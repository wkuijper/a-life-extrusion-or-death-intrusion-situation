class FloatTree {
    
    constructor() {
        const rootNode = new FloatTreeNode();
        // default root reference,
        // keeps root from being freed:
        rootNode._incRefCount();
        this.__rootNode = rootNode;
        this.__firstFreeNode = null;
    }

    _freeNode(node) {
        if (node._parent === null) {
            throw new Error(`invariant violation: root should always be referenced`);
        }
        if (node._zeroChild !== null) {
            throw new Error(`invariant violation: children must be freed before parents`);
        }    
        if (node._oneChild !== null) {
            throw new Error(`invariant violation: children must be freed before parents`);
        }    
        if (node._refCount !== 0) {
            throw new Error(`invariant violation: node is still referenced or reference count is corrupted`);
        }     
        if (node._posObj !== null) {
            throw new Error(`invariant violation: node is still occupied`);
        } 
        if (node._negObj !== null) {
            throw new Error(`invariant violation: node is still occupied`);
        }
        node._parent = null;
        node._lvl = 0;
        node._refCount = 1;
        if (this.__firstFreeNode !== null) {
            node._oneChild = this.__firstFreeNode;
            this.__firstFreeNode = node;
        }
    }

    _newNode() {
        if (this.__firstFreeNode !== null) {
            const newNode = this.__firstFreeNode;
            this.__firstFreeNode = newNode._oneChild;
            return newNode;
        } else {
            return new FloatTreeNode();
        }
    }
    
    _incRefCount(node) {
        let currNode = node;
        do {
            currNode._refCount++;
            currNode = currNode._parent;
        } while (currNode !== null);
    }

    _decRefCount(node) {
        let currNode = node;
        do {
            if (currNode._refCount < 1) {
                throw new Error(`invariant violation: reference count is corrupted`);
            }            
            currNode._refCount--;
            const parentNode = currNode.parent;
            if (currNode._refCount === 0) {
                this._freeNode(currNode);
            }
            currNode = parentNode;
        } while (currNode !== null);
    }

    _occupyPos(node, posObj) {
        if (node._posObj !== null) {
            throw new Error(`invariant violation: node already occupied`);
        }
        node._posObj = posObj;
        this._incRefCount(node);
    }
    
    _deoccupyPos(node) {
        if (node._posObj === null) {
            throw new Error(`invariant violation: node is not occupied`);
        }
        node._posObj = null;
        this._decRefCount(node);
    }
    
    _occupyNeg(node, negObj) {
        if (node._negObj !== null) {
            throw new Error(`invariant violation: node already occupied`);
        }
        node._negObj = negObj;
        this._incRefCount(node);
    }
    
    _deoccupyNeg(node) {
        if (node._negObj === null) {
            throw new Error(`invariant violation: node is not occupied`);
        }
        node._negObj = null;
        this._decRefCount(node);
    }
    
    // methods below should only be called
    // by handles (because the reference
    // counts of returned node might be zero
    // which necesitates the implicit reference
    // of the handle)

    _parent(node) {
        if (node._parent === null) {
            const oldRoot = node;
            const newRoot = this._newNode();
            newRoot._lvl = oldRoot._lvl + 1;
            newRoot._zeroChild = oldRoot;
            
            // the default root reference moves one level up,
            // the old root reference count is decreased
            // this might mean the old root _refCount
            // becomes zero, for that reason only handles
            // should call this method:
            newRoot._refCount = oldRoot._refCount;
            oldRoot._refCount = oldRoot._refCount - 1;
            
            oldRoot._parent = newRoot;
            this.__rootNode = newRoot;
        }
        return node._parent;
    }
    
    _zeroChild(node) {
        if (node._zeroChild === null) {
            const zeroChild = new FloatTreeNode();
            zeroChild._parent = node;
            node._zeroChild = zeroChild;
        }
        return node._zeroChild;
    }
    
    _oneChild(node) {
        if (node._oneChild === null) {
            const oneChild = new FloatTreeNode();
            oneChild._parent = node;
            node._oneChild = oneChild;
        }
        return node._oneChild;
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
        this._refCount = 0;
    }

}

class FloatTreeHandle {

    get level() {
        return this.__node._lvl;
    }
    
    constructor(tree) {
        this.__tree = tree;
        this.__node = null;
        this.__signIsNeg = false;
    }

    attach(node) {
        if (node !== null) {
            throw new Error(`handle is already attached to node`)
        }
        this.__node = node;
        // handle now implicitly references node
        // this means it will check if node or
        // node ancestor needs to be freed
        // upon movement or detachment.
        // This allows construction of the tree 
        // without quadratic overhead due to
        // constant _incRefCount _decRefCount calls.
    }

    detach(node) {
        const tree = this.__tree;
        let node = this.__node;
        if (node === null) {
            throw new Error(`handle is not attached to node`)
        }
        // remove implicit reference,
        // check if node or node ancestors
        // need to be freed:
        while (node._refCount === 0) {
            const parentNode = node._parent;
            tree._freeNode(node);
            node = parentNode;
            if (node === null) {
                throw new Error(`invariant violation: root was not referenced`);
            }
        } 
        this.__node = null;
        this.__signIsNeg = false;
    }

    negate() {
        let node = this.__node;
        if (node === null) {
            throw new Error(`handle is not attached to node`)
        }
        this.__signIsNeg = !this.__signIsNeg;
    }

    occupy(obj) {
        const tree = this.__tree;
        let node = this.__node;
        if (node === null) {
            throw new Error(`handle is not attached to node`)
        }
        if (this.__signIsNeg) {
            tree._occupyNeg(node, obj);
        } else {
            tree._occupyPos(node, obj);
        }
    }

    deoccupy(obj) {
        const tree = this.__tree;
        let node = this.__node;
        if (node === null) {
            throw new Error(`handle is not attached to node`)
        }
        if (this.__signIsNeg) {
            tree._deoccupyNeg(node);
        } else {
            tree._deoccupyPos(node);
        }
    }
    
    levelUp(lvl) {
        if (lvl === undefined) {
            lvl = node._lvl + 1;
        }
        const tree = this.__tree;
        let node = this.__node;
        if (node === null) {
            throw new Error(`handle is not attached to node`)
        }
        while (node._lvl < lvl) {
            const parentNode = node._parent;
            // remove implicit handle reference,
            // check if node needs to be freed:
            if (node._refCount === 0) {
                tree._freeNode(node);
            }
            node = parentNode;
        }
        this.__node = node;
    }

    appendZero() {
        const tree = this.__tree;
        let node = this.__node;
        if (node === null) {
            throw new Error(`handle is not attached to node`)
        }
        const nextNode = tree._zeroNode(node);
        // current node is parent of new node,
        // so implicit reference protects this
        // node, no freeing necessary:
        node = nextNode;
        this.__node = node;
    }

    appendOne() {
        const tree = this.__tree;
        let node = this.__node;
        if (node === null) {
            throw new Error(`handle is not attached to node`)
        }
        const nextNode = tree._oneNode(node);
        // current node is parent of new node,
        // so implicit reference protects this
        // node, no freeing necessary:
        node = nextNode;
        this.__node = node;
    }    
}

