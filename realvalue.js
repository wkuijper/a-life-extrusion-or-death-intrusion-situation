import FloatTree from "./realsimilar.js";

class Reality {

    constructor(checker) {
        this.__similarTree = new FloatTree();        
        this.__checker = checker;
    }
    
}

class RealValue {

    constructor(reality) {
        this.__reality = reality;
    }
    
}

const LIMB_LEN = 32; // 32 bits fit safely in a javascript number
                     // with some room to spare for tricks

class ApproximatelyReal {

    _addFinishedLimb(limb) {
        this.__finishedLimbs.push(limb);
    }

    _addLimbBit(bit) {
        const currLen = this.__incompleteLimbLen;
        const shiftedBit = bit << currLen;
        const currLimb = this.__inclompleteLimb;
        const nextLimb = currLimb | currLimb;
        const nextLen = currLen + 1;
        if (nextLen < LIMB_LEN) {
            this.__inclompleteLimb = nextLimb;
            this.__inclompleteLimbLen = nextLen;
        } else {
            this._addFinishedLimb(nextLimb);
            this.__inclompleteLimb = 0;
            this.__inclompleteLimbLen = 0;
        }
    }
    
    _addLimbBits(word, n) {
        const currLimb = this.__incompleteLimb; 
        const currLen = this.__incompleteLimbLen;
        const remainingLen = LIMB_LEN - currLen;
        if (n < remainingLen) {
            const limbPart = word << currLen;
            const nextLimb = currLimb | limbPart;
            const nextLen = currLen + n;
            this.__incompleteLimb = nextLimb;
            this.__incompleteLimbLen = nextLen;
        } else if (n === remainingLen) {
            const limbPart = word << currLen;
            const finishedLimb = currLimb | limbPart;
            this._addFinishedLimb(finishedLimb)
            this.__incompleteLimb = 0;
            this.__incompleteLimbLen = 0;
        } else {
            const mask = ((1<<remainingLen) - 1);
            const limbPart = (word & mask) << currLen;
            const finishedLimb = currLimb | limbPart;
            this._addFinishedLimb(finishedLimb);
            let remainigWord = word >> currLen;
            let remainingN = n - currLen;
            while (remainingN >= LIMB_LEN) {
                const mask = ((1 << LIMB_LEN) - 1);
                const finishedLimb = (remainigWord & mask);
                this._addFinishedLimb(finishedLimb);
                remainingWord = remainigWord >> LIMB_LEN;
                remainingN = remainingN - LIMB_LEN;
            }
            if (remainingN > 0) {        
                const finalMask = ((1 << remainingN) - 1);
                const finalLimb = (remainingWord & finalMask);
                this.__incompleteLimb = finalLimb;
                this.__incompleteLimbLen = remainingN;
            } else {
                this.__incompleteLimb = 0;
                this.__incompleteLimbLen = 0;
            }
        }
    }
    
    constructor(reality) {
        this.__reality = reality;
        this.__finishedLimbs = [];
        this.__inclompleteLimb = 0;
        this.__inclompleteLimbLen = 0;
    }
}

class RealExpr {

    constructor(reality, opOrConstStr) {
        this.__reality = reality;
        this.__opOrConstStr = opOrConstStr;
    }
    
}

class NatExpr {

    constructor(reality, opOrConstStr) {
        super(reality, opOrConstStr);
        
    }
    
}