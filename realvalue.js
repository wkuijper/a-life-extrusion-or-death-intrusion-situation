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

const BARE_LIMB_LEN = 30;  // 30 bits fit safely in a javascript number (32 max)
                           // with some room to spare for tricks

const EXTENDED_LIMB_OVERFLOW = (1 << BARE_LIMB_LEN);

const BARE_LIMB_MASK = EXTENDED_LIMB_OVERFLOW - 1; // Mask of all 1 bits

class LimbString {

    _addFinishedLimb(limb) {
        this.__finishedLimbs.push(limb);
    }

    _addLimbBit(bit) {
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

    addWholeLimb(limb) {
        if (this.__frozen) {
            throw new Error(`can't modify frozen BitString`);
        }
        if (this.__inclompleteLimbLen > 0) {
            throw new Error(`can't add whole limb with incomplete limb pending`);
        }
        this._addFinishedLimb(limb);
    }
    
    addLimbBits(wordJSN, numberOfBits) {
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

class BigNatural {

    constructor(maxNumberOfLimbs) {
        this._limbs = Uint32Array(maxNumberOfLimbs);
        this._numberOfLimbs = 0; // invariant: last limb is nonzero
        this._sign = 1;
    }
    
}

class BigInteger {

    constructor(maxNumberOfLimbs) {
        this._magnitude = new BigNatural(maxNumberOfLimbs);
        this._sign = 1;
    }

}

function addBigNaturals(bnA, bnB) {
    const numberOfLimbsA = bnA._numberOfLimbs;
    const numberOfLimbsB = bnB._numberOfLimbs;
    const longerB = (numberOfLimbsB > numberOfLimbsA);
    const bn1 = longerB ? bnB : bnA;
    const bn2 = longerB ? bnA : bnB;
    const numberOfLimbs1 = bn1._numberOfLimbs;
    const numberOfLimbs2 = bn2._numberOfLimbs;
    const limbs1 = bn1._limbs;
    const limbs2 = bn2._limbs;
    const result = new BigInteger(numberOfLimbs1 + 1);
    const resultLimbs = result._limbs;
    let carry = 0;
    // first add all the common limbs
    // note: numberOfLimbs2 <= numberOfLimbs1
    for (let i = 0; i < numberOfLimbs2; i++) { 
        const limb1 = limbs1[i];
        const limb2 = limbs2[i];
        const sum = carry + limb1 + limb2;
        const limb = sum & BARE_LIMB_MASK;
        resultLimbs[i] = limb;
        carry = sum >> BARE_LIMB_LEN;
    }
    // next add the remaining limbs
    // note: numberOfLimbs1 >= numberOfLimbs2
    for (let i = numberOfLimbs2; i < numberOfLimbs1; i++) { 
        const limb1 = limbs1[i];
        const sum = carry + limb1;
        const limb = sum & BARE_LIMB_MASK;
        resultLimbs[i] = limb;
        carry = sum >> BARE_LIMB_LEN;
    }
    // finally append the carry (if there is one)
    if (carry > 0) {
        resultLimbs[numberOfLimbs1] = carry;
        result._numberOfLimbs = numberOfLimbs1 + 1;
    } else {
        result._numberOfLimbs = numberOfLimbs1;
    }
}

function compareBigNaturals(bnA, bnB) {
    const numberOfLimbsA = bnA._numberOfLimbs;
    const numberOfLimbsB = bnB._numberOfLimbs;
    if (numberOfLimbsA > numberOfLimbsB) {
        return 1;
    }
    if (numberOfLimbsA < numberOfLimbsB) {
        return -1;
    }
    const numberOfLimbs = numberOfLimbsA // (=== numberOfLimbsB)
    if (numberOfLimbs === 0) {
        return 0;
    }
    const limbsA = bnA._limbs;
    const limbsB = bnA._limbs;
    for (let i = numberOfLimbs - 1; i >= 0; i--) {
        const limbA = limbsA[i];
        const limbB = limbsB[i];
        if (limbA < limbB) {
            return -1;
        }
        if (limbA > limbB) {
            return 1;
        }
    }
    return 0;
}

function subtractBigNaturals(bn1, bn2) {
    // precondition: bn1 >= bn2 
    // (which implies bn1._numberOfLimbs >= bn2._numberOfLimbs)
    const numberOfLimbs1 = bn1._numberOfLimbs;
    const numberOfLimbs2 = bn2._numberOfLimbs;
    const limbs1 = bn1._limbs;
    const limbs2 = bn2._limbs;
    const result = new BigInteger(numberOfLimbs1);
    const resultLimbs = result._limbs;
    let carry = 0;
    // first subtract all the common limbs
    // note: numberOfLimbs2 <= numberOfLimbs1
    for (let i = 0; i < numberOfLimbs2; i++) { 
        const limb1 = limbs1[i];
        const limb2 = limbs2[i];
        const diff = (limb1 | EXTENDED_LIMB_OVERFLOW) - (limb2 + carry);
        const limb = diff & BARE_LIMB_MASK;
        resultLimbs[i] = limb;
        carry = (~diff) >> BARE_LIMB_LEN;
    }
    // next subtract the remaining limbs
    // note: numberOfLimbs1 >= numberOfLimbs2
    for (let i = numberOfLimbs2; i < numberOfLimbs1; i++) {
        const limb1 = limbs1[i];
        const diff = (limb1 | EXTENDED_LIMB_OVERFLOW) - carry;
        const limb = diff & BARE_LIMB_MASK;
        resultLimbs[i] = limb;
        carry = (~diff) >> BARE_LIMB_LEN;
        
        const limb1 = limbs1[i];
        const limb2 = 0;
        const sum = carry + limb1 + limb2;
        const limb = sum & BARE_LIMB_MASK;
        resultLimbs[i] = limb;
        carry = sum >> BARE_LIMB_LEN;
    }
    // finally append the carry (if there is one)
    if (carry > 0) {
        resultLimbs[numberOfLimbs1] = carry;
        result._numberOfLimbs = numberOfLimbs1 + 1;
    } else {
        result._numberOfLimbs = numberOfLimbs1;
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