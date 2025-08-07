class FloatTree {
    
    constructor() {
        const rootNode = new FloatTreeNode(); // <-- refCount === 1
        this.__rootNode = rootNode;
        this.__firstFreeNode = null;
    }

    _freeNode(node) {
        
        const parent = node._parent;
        const isOneChild = 
            ((node._flags & _NODE_FLAG__IS_ONE_CHILD) !== 0);

        if (parent === null) {
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
        node._flags = 0;

        // put in free list
        if (this.__firstFreeNode !== null) {
            node._oneChild = this.__firstFreeNode;
            this.__firstFreeNode = node;
        }

        // potentially, recursively, free parent
        if (isOneChild) {
            parent._oneChild = null;
            this._decRefCount(parent);
        } else {
            parent._zeroChild = null;
            this._decRefCount(parent);
        }
    }

    _newNode() {
        if (this.__firstFreeNode !== null) {
            const newNode = this.__firstFreeNode;
            this.__firstFreeNode = newNode._oneChild;
            this._incRefCount(newNode);
            return newNode;
        } else {
            return new FloatTreeNode(); // <-- refCOunt === 1
        }
    }
    
    _incRefCount(node) {
        currNode._refCount++;
    }

    _decRefCount(node) {
        if (node._refCount < 1) {
            throw new Error(`invariant violation: reference count is corrupted`);
        }            
        node._refCount--;
        if (node._refCount === 0) {
            this._freeNode(node);
        }
    }

    _occupyPos(node, posObj) {
        if (node._posObj !== null) {
            throw new Error(`invariant violation: node already occupied`);
        }
        this._incRefCount(node); 
        node._posObj = posObj; // posObj refers to node
        this._setPosObjFlag(node);
    }
    
    _deoccupyPos(node) {
        if (node._posObj === null) {
            throw new Error(`invariant violation: node is not occupied`);
        }
        this._unsetPosObjFlag(node);
        node._posObj = null; // posObj no longer refers to node
        this._decRefCount(node);
    }
    
    _occupyNeg(node, negObj) {
        if (node._negObj !== null) {
            throw new Error(`invariant violation: node already occupied`);
        }
        this._incRefCount(node);
        node._negObj = negObj; // negObj refers to node
        this._setNegObjFlag(node);
    }
    
    _deoccupyNeg(node) {
        if (node._negObj === null) {
            throw new Error(`invariant violation: node is not occupied`);
        }
        this._unsetNegObjFlag(node);
        node._negObj = null; // negObj no longer refers to node
        this._decRefCount(node);
    }

    _setPosObjFlag(node) {
        let currNode = node;
        do {
            const flags = (currNode._flags | _NODE_FLAG__HAS_POS_OBJ);
            currNode._flags = flags;
            const parentNode = currNode.parent;
            if (parentNode === null) {
                break;
            }
            if ((flags & _NODE_FLAG__HAS_POS_OBJ) !== 0) {
                return;
            }
            currNode = parentNode;
        } while (true);
    }

    _unsetPosObjFlag(node) {
        let currNode = node;
        do {
            const flags = (currNode._flags & ~_NODE_FLAG__HAS_POS_OBJ);
            currNode._flags = flags;
            const parentNode = currNode.parent;
            if (parentNode === null) {
                break;
            }
            if ((flags & _NODE_FLAG__IS_ONE_CHILD) !== 0) {
                const zeroChild = parentNode._zeroChild;
                if (zeroChild !== null) {
                    const zeroFlags = zeroChild._flags;
                    if ((zeroFlags & _NODE_FLAG__HAS_POS_OBJ) !== 0) {
                        return;
                    }
                }
            } else {
                const oneChild = parentNode._oneChild;
                if (oneChild !== null) {
                    const oneFlags = oneChild._flags;
                    if ((oneFlags & _NODE_FLAG__HAS_POS_OBJ) !== 0) {
                        return;
                    }
                }
            }
            currNode = parentNode;
        } while (true);
    }

    _setNegObjFlag(node) {
        let currNode = node;
        do {
            const flags = (currNode._flags | _NODE_FLAG__HAS_NEG_OBJ);
            currNode._flags = flags;
            const parentNode = currNode.parent;
            if (parentNode === null) {
                break;
            }
            if ((flags & _NODE_FLAG__HAS_NEG_OBJ) !== 0) {
                return;
            }
            currNode = parentNode;
        } while (true);
    }

    _unsetNegObjFlag(node) {
        let currNode = node;
        do {
            const flags = (currNode._flags & ~_NODE_FLAG__HAS_NEG_OBJ);
            currNode._flags = flags;
            const parentNode = currNode.parent;
            if (parentNode === null) {
                break;
            }
            if ((flags & _NODE_FLAG__IS_ONE_CHILD) !== 0) {
                const zeroChild = parentNode._zeroChild;
                if (zeroChild !== null) {
                    const zeroFlags = zeroChild._flags;
                    if ((zeroFlags & _NODE_FLAG__HAS_NEG_OBJ) !== 0) {
                        return;
                    }
                }
            } else {
                const oneChild = parentNode._oneChild;
                if (oneChild !== null) {
                    const oneFlags = oneChild._flags;
                    if ((oneFlags & _NODE_FLAG__HAS_NEG_OBJ) !== 0) {
                        return;
                    }
                }
            }
            currNode = parentNode;
        } while (true);
    }
    
    _parent(node) {
        if (node._parent === null) {
            const oldRoot = node;
            const newRoot = this._newNode(); // <-- refCount === 1
            newRoot._lvl = oldRoot._lvl + 1;
            
            this._incRefCount(newRoot); // child refers to parent
            newRoot._zeroChild = oldRoot;
            oldRoot._parent = newRoot;
            
            this._incRefCount(newRoot); // gains rootNode reference
            this.__rootNode = newRoot;
            this._decRefCounts(oldRoot); // looses rootNode reference 

            // we need not increase the refcount because it's new
            return newRoot;
        } else {
            const parent = node._parent;
            this._incRefCount(parent);
            return parent;
        }
    }
    
    _zeroChild(node) {
        if (node._zeroChild === null) {
            const zeroChild = this._newNode(); // <-- refCount === 1
            zeroChild._parent = node;
            this._incRefCount(node); // child refers to parent
            node._zeroChild = zeroChild;
            
            // we need not increase the refcount because it's new
            return zeroChild;
        } else {
            const zeroChild = node._zeroChild;
            this._incRefCount(zeroChild);
            return zeroChild;
        }
    }
    
    _oneChild(node) {
        if (node._oneChild === null) {
            const oneChild = this._newNode(); // <-- refCount === 1
            oneChild._parent = node;
            this._incRefCount(node); // child refers to parent
            node._oneChild = oneChild;
            oneChild.flags = (node._flags | _NODE_FLAG__IS_ONE_CHILD);
            // we need not increase the refcount because it's new
            return oneChild;
        } else {
            const oneChild = node._oneChild;
            this._incRefCount(oneChild);
            return oneChild;
        }
    }
}

const _NODE_FLAG__IS_ONE_CHILD = (1 << 0);
const _NODE_FLAG__HAS_NEG_OBJ = (1 << 1);
const _NODE_FLAG__HAS_POS_OBJ = (1 << 2);

class FloatTreeNode {

    constructor() {
        this._lvl = 0;
        this._flags = 0;
        this._parent = null;
        this._zeroChild = null;
        this._oneChild = null;
        this._posObj = null;
        this._negObj = null;
        this._refCount = 1; // <-- invariant says node can only 
                            //     exist, in the wild, with non-
                            //     zero refCOunt
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
        const tree = this.__tree;
        if (tree.__node !== null) {
            throw new Error(`handle is already attached to node`)
        }
        tree._incRefCount(node);
        this.__node = node;
    }

    detach() {
        const tree = this.__tree;
        let node = this.__node;
        if (node === null) {
            throw new Error(`handle is not attached to node`)
        } 
        this.__signIsNeg = false;
        this.__node = null;
        tree._decRefCount(node);
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

    deoccupy() {
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
            const parentNode = tree._parentNode(node);
            // switching refcount is not yet needed
            // parentNode is protected by current node
            node = parentNode;
        }
        // now that we have the final parent node
        // we switch the refcount
        tree._decRefCount(this.__node);
        this.__node = node;
    }

    appendZero() {
        const tree = this.__tree;
        let node = this.__node;
        if (node === null) {
            throw new Error(`handle is not attached to node`)
        }
        node = tree._zeroChild(node);
        tree._decRefCount(this.__node);
        this.__node = node;
    }

    appendOne() {
        const tree = this.__tree;
        let node = this.__node;
        if (node === null) {
            throw new Error(`handle is not attached to node`)
        }
        node = tree._oneNode(node);
        tree._decRefCount(this.__node);
        this.__node = node;
    }    
}

