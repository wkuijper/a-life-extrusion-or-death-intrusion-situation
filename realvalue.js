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

const BARE_LIMB_LEN = 20;  // 20 bits fit safely in a javascript number (32 max)
                           // with some room to spare for tricks (see below)

const PUMPED_LIMB_LEN = BARE_LIMB_LEN + 2; // extra bits for overflow makes 22 bits 

const DRESSED_LIMB_LEN = PUMPED_LIMB_LEN + 8; // extra protocol bits makes 30 bits


LIMB_MASK_STATE = (1|2) << PUMPED_LIMB_LEN
LIMB_MASK_ARG = (1|2|4|8) << PUMPED_LIMB_LEN + 

class LimbProtocolMachine {

    constructor() {
        this.__state = LIMB_PROTOCOL_EXP_STATE;
    }

    submitExponentAsJavascriptNumber(expJSN) {
        
    }

    submitMantissaPartAsJavascriptNumber(mantissaPartJSN, numberOfBits) {
        
    }
}

class LimbString {

    _addFinishedLimb(limb) {
        if (this.__frozen) {
            throw new Error(`can't modify frozen BitString`);
        }
        this.__finishedLimbs.push(limb);
    }

    _addLimbBit(bit) {
        if (this.__frozen) {
            throw new Error(`can't modify frozen BitString`);
        }
        const currLen = this.__incompleteLimbLen;
        const shiftedBit = bit << currLen;
        const currLimb = this.__inclompleteLimb;
        const nextLimb = currLimb | currLimb;
        const nextLen = currLen + 1;
        if (nextLen < BARE_LIMB_LEN) {
            this.__inclompleteLimb = nextLimb;
            this.__inclompleteLimbLen = nextLen;
        } else {
            this._addFinishedLimb(nextLimb);
            this.__inclompleteLimb = 0;
            this.__inclompleteLimbLen = 0;
        }
    }
    
    _addLimbBits(wordJSN, numberOfBits) {
        if (this.__frozen) {
            throw new Error(`can't modify frozen BitString`);
        }
        const currLimb = this.__incompleteLimb; 
        const currLen = this.__incompleteLimbLen;
        const remainingLen = BARE_LIMB_LEN - currLen;
        if (numberOfBits < remainingLen) {
            const limbPart = wordJSN << currLen;
            const nextLimb = currLimb | limbPart;
            const nextLen = currLen + numberOfBits;
            this.__incompleteLimb = nextLimb;
            this.__incompleteLimbLen = nextLen;
        } else if (numberOfBits === remainingLen) {
            const limbPart = wordJSN << currLen;
            const finishedLimb = currLimb | limbPart;
            this._addFinishedLimb(finishedLimb)
            this.__incompleteLimb = 0;
            this.__incompleteLimbLen = 0;
        } else /* numberOfBits > remainingLen */ {
            const mask = ((1<<remainingLen) - 1);
            const limbPart = (wordJSN & mask) << currLen;
            const finishedLimb = currLimb | limbPart;
            this._addFinishedLimb(finishedLimb);
            let remainigWord = wordJSN >> currLen;
            let remainingNumberOfBits = numberOfBits - currLen;
            while (remainingNumberOfBits >= BARE_LIMB_LEN) { // <-- overkill for 32 bits
                const mask = ((1 << BARE_LIMB_LEN) - 1);
                const finishedLimb = (remainigWord & mask);
                this._addFinishedLimb(finishedLimb);
                remainingWord = remainigWord >> BARE_LIMB_LEN;
                remainingNumberOfBits = remainingNumberOfBits - BARE_LIMB_LEN;
            }
            // ^^ for 32 bits we will mostly end up here right away
            if (remainingNumberOfBits > 0) {        
                const finalMask = ((1 << remainingNumberOfBits) - 1);
                const finalLimb = (remainingWord & finalMask);
                this.__incompleteLimb = finalLimb;
                this.__incompleteLimbLen = remainingNumberOfBits;
            } else {
                this.__incompleteLimb = 0;
                this.__incompleteLimbLen = 0;
            }
        }
    }

    freeze() {
        this.__frozen = true;
        return this;
    }
    
    constructor() {
        this.__finishedLimbs = [];
        this.__inclompleteLimb = 0;
        this.__inclompleteLimbLen = 0;
        this.__frozen = false;
    }
}

class NatNumber {

    constructor(frozenBitString) {
        
    }
}
class RealExpr {

    constructor(reality) {
        this.__reality = reality;
        
        
    }
    
}

class NatExpr {

    constructor(reality, natNumber) {
        super(reality, opOrConstStr);
        
    }
    
}