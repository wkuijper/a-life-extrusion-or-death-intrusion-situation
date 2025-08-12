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

const BARE_LIMB_LEN_MINUS_ONE = BARE_LIMB_LEN - 1;

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
    const result = new BigNatural(bn1._numberOfLimbs + 1);
    return __addBigNaturals(bn1, bn2, result);
}

function _addBigNaturals(bnA, bnB, result) {
    const numberOfLimbsA = bnA._numberOfLimbs;
    const numberOfLimbsB = bnB._numberOfLimbs;
    const longerB = (numberOfLimbsB > numberOfLimbsA);
    const bn1 = longerB ? bnB : bnA;
    const bn2 = longerB ? bnA : bnB;
    return __addBigNaturals(bn1, bn2, result);
}

function __addBigNaturals(bn1, bn2, result) {
    // precondition: bn1._numberOfLimbs >= bn2._numberOfLimbs
    const numberOfLimbs1 = bn1._numberOfLimbs;
    const numberOfLimbs2 = bn2._numberOfLimbs;
    const limbs1 = bn1._limbs;
    const limbs2 = bn2._limbs;
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
    return result;
}

function _addPowerOfTwoToBigNatural(exp, bnmutable) {
    // pre-condition: exp >= 0
    // pre-condition: bnmutable capacity fits the result of adding 2^exp
    const numberOfLimbs = bnmutable._numberOfLimbs;
    const limbs = bnmutable._limbs;
    const expPlusOne = exp + 1;
    const numberOfVirtualLimbs = math.ceil(expPlusOne / BARE_LIMB_LEN);
    const minimalRequiredNumberOfLimbs = Math.max(numberOfLimbs, numberOfVirtualLimbs);
    for (let i = numberOfLimbs; i < minimalRequiredNumberOfLimbs; i++) {
        limbs[i] = 0;
    }
    const numberOfVirtualLimbsMinus1 = numberOfVirtualLimbs - 1;
    const expInMostSignificantVirtualLimb = exp - (numberOfVirtualLimbsMinus1 * BARE_LIMB_LEN); 
    let carry = 1 << expInMostSignificantVirtualLimb;
    let currLimbIndex = numberOfVirtualLimbsMinus1;
    do {
        const currLimb = currLimbIndex < minimalRequiredNumberOfLimbs ? limbs[currLimbIndex] : 0;
        const extIncLimb = currLimb + carry;
        const nextCarry = (extLimb & EXTENDED_LIMB_OVERFLOW) >> BARE_LIMB_LEN;
        carry = nextCarry;
        const bareIncLimb = extLimb & BARE_LIMB_MASK;
        limbs[currLimbIndex] = bareIncLimb;
        currLimbIndex++;
    } while (carry > 0);
    bnmutable._numberOfLimbs = currLimbIndex;
    return bnmutable;
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
    const result = new BigInteger(bn1._numberOfLimbs);
    return _subtractBigNaturals(bn1, bn2, result);
}

function _subtractBigNaturals(bn1, bn2, result) {
    // precondition: bn1 >= bn2 
    // (which implies bn1._numberOfLimbs >= bn2._numberOfLimbs)
    const numberOfLimbs1 = bn1._numberOfLimbs;
    const numberOfLimbs2 = bn2._numberOfLimbs;
    const limbs1 = bn1._limbs;
    const limbs2 = bn2._limbs;
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
    // next subtract all but the last of the remaining limbs
    // note: numberOfLimbs1 >= numberOfLimbs2
    const numberOfLimbs1minus1 = numberOfLimbs1 - 1;
    for (let i = numberOfLimbs2; i < numberOfLimbs1minus1; i++) {
        const limb1 = limbs1[i];
        const diff = (limb1 | EXTENDED_LIMB_OVERFLOW) - carry;
        const limb = diff & BARE_LIMB_MASK;
        resultLimbs[i] = limb;
        carry = (~diff) >> BARE_LIMB_LEN;
    }
    // finally subtract the last limb
    // and set the correct number of result limbs
    const lastLimb1 = limbs1[numberOfLimbs1minus1];
    // invariant: lastLimb !== 0
    const lastDiff = (lastLimb1 | EXTENDED_LIMB_OVERFLOW) - carry;
    const lastResultLimb = lastDiff & BARE_LIMB_MASK;
    // invariant: carry must be zero because lastLimb !== 0
    if (lastResultLimb === 0) {
        result._numberOfLimbs = numberOfLimbs1minus1;  
    } else {
        resultLimbs[numberOfLimbs1minus1] = lastResultLimb;
        result._numberOfLimbs = numberOfLimbs1;
    }
    return result;
}

function shiftRightBigNatural(bn) {
    const result = new BigNatural(bn._numberOfLimbs);
    return _shiftRightBigNatural(bn, bits, result);
}

function _shiftRightBigNatural(bn, result) {
    const numberOfLimbs = bn._numberOfLimbs;
    const limbs = bn._limbs;
    const resultLimbs = result._limbs;
    // shift the most significant limb first
    let numberOfLimbsMinus1 = numberOfLimbs - 1;
    const mostSignificantLimb = limbs[numberOfLimbsMinus1];
    let carry = mostSignificantLimb & 1; 
    const mostSignificantResultLimb = (mostSignificantLimb >> 1);
    if (mostSignificantResultLimb === 0) {
        result._numberOfLimbs = numberOfLimbsMinus1;
    } else {
        result._numberOfLimbs = numberOfLimbs;
        resultLimbs[numberOfLimbs1minus1] = mostSignificantResultLimb;
    }
    // then do the rest taking into acount the carry bit
    for (let i = numberOfLimbsMinus1 - 1; i >= 0; i++) {
        const limb = limbs[i];
        const nextCarry = limb & 1; 
        const resultLimb = (limb >> 1) | (carry << BARE_LIMB_LEN_MINUS_ONE);
        resultLimbs[i] = resultLimb;
        carry = nextCarry;
    }
    return result;
}

function _shiftRightBigNaturalByBits(bn, numberOfBitsToShift, result) {
    // precondition: numberOfBitsToShift < BARE_LIMB_LEN
    const numberOfLimbs = bn._numberOfLimbs;
    const limbs = bn._limbs;
    const resultLimbs = result._limbs;
    // shift the most significant limb first
    const numberOfBitsToUnshift = BARE_LIMB_LEN - numberOfBitsToShift;
    const carryMask = ((1 << numberOfBitsToShift) - 1);
    let numberOfLimbsMinus1 = numberOfLimbs - 1;
    const mostSignificantLimb = limbs[numberOfLimbsMinus1];
    let carry = mostSignificantLimb & carryMask; 
    const mostSignificantResultLimb = 
        (mostSignificantLimb >> numberOfBitsToShift);
    if (mostSignificantResultLimb === 0) {
        result._numberOfLimbs = numberOfLimbsMinus1;
    } else {
        result._numberOfLimbs = numberOfLimbs;
        resultLimbs[numberOfLimbs1minus1] = mostSignificantResultLimb;
    }
    // then do the rest taking into acount the carry
    for (let i = numberOfLimbsMinus1 - 1; i >= 0; i++) {
        const limb = limbs[i];
        const nextCarry = limb & carryMask; 
        const resultLimb = 
            (limb >> numberOfBitsToShift) 
            | (carry << numberOfBitsToUnshift);
        resultLimbs[i] = resultLimb;
        carry = nextCarry;
    }
    return result;
}

function _shiftRightBigNaturalByLimbs(bn, numberOfLimbsToShift, result) {
    const numberOfLimbs = bn._numberOfLimbs;
    const numberOfRemainingLimbs = 
        Math.max(0, numberOfLimbs - numberOfLimbsToShift);
    const limbs = bn._limbs;
    const resultLimbs = result._limbs;
    // shifted the limbs
    for (let i = 0; i < numberOfRemainingLimbs; i++) {
        resultLimbs[i] = limbs[i + numberOfLimbsToShift];
    }
    result._numberOfLimbs = numberOfRemainingLimbs;
    return result;
}

function _shiftLeftBigNatural(bn, result) {
    // precondition: capacity of result is one greater than the number of limbs in bn
    const numberOfLimbs = bn._numberOfLimbs;
    const limbs = bn._limbs;
    const resultLimbs = result._limbs;
    // shift the limbs from the least significant to the most significant
    const carryMask = 1 << (BARE_LIMB_LEN_MINUS_ONE);
    let carry = 0;
    for (let i = 0; i < numberOfLimbs; i++) {
        const limb = limbs[i];
        const nextCarry = (limb & carryMask) >> BARE_LIMB_LEN_MINUS_ONE; 
        const resultLimb = (limb << 1) | carry;
        resultLimbs[i] = resultLimb;
        carry = nextCarry;
    }
    // put the carry in
    if (carry === 0) {
        result._numberOfLimbs = numberOfLimbs;
    } else {
        resultLimbs[numberOfLimbs] = carry;
        result._numberOfLimbs = numberOfLimbs + 1;
    }
    return result;
}

function _shiftLeftBigNaturalByBits(bn, numberOfBitsToShift, result) {
    // precondition: numberOfBitsToShift < BARE_LIMB_LEN
    // precondition: capacity of result is one greater than the number of limbs in bn
    const numberOfLimbs = bn._numberOfLimbs;
    const limbs = bn._limbs;
    const resultLimbs = result._limbs;
    // shift the limbs from the least significant to the most significant
    const numberOfBitsToUnshift = BARE_LIMB_LEN - numberOfBitsToShift;
    const carryMask = ((1 << numberOfBitsToShift) - 1) << numberOfBitsToUnshift;
    let carry = 0;
    for (let i = 0; i < numberOfLimbs; i++) {
        const limb = limbs[i];
        const nextCarry = (limb & carryMask) >> numberOfBitsToUnshift; 
        const resultLimb = (limb << numberOfBitsToShift) | carry;
        resultLimbs[i] = resultLimb;
        carry = nextCarry;
    }
    // put the carry in
    if (carry === 0) {
        result._numberOfLimbs = numberOfLimbs;
    } else {
        resultLimbs[numberOfLimbs] = carry;
        result._numberOfLimbs = numberOfLimbs + 1;
    }
    return result;
}

function _shiftLeftBigNaturalByLimbs(bn, numberOfLimbsToShift, result) {
    // precondition: numberOfLimbsToShift < bn._numberOfLimbs
    // precondition: capacity of result is numberOfLimbs + numberOfLimbsToShift
    const numberOfLimbs = bn._numberOfLimbs;
    const limbs = bn._limbs;
    const resultLimbs = result._limbs;
    // first the shifted limbs
    for (let i = numberOfLimbs - 1; i >= 0; i--) {
        resultLimbs[i + numberOfLimbsToShift] = limbs[i];
    }
    // then pad the rest with zero-limbs
    for (let i = numberOfLimbsToShift - 1; i >= 0; i--) {
        resultLimbs[i] = 0;
    }
    result._numberOfLimbs = numberOfLimbs + numberOfLimbsToShift;
    return result;
}

function _shiftLeftBigNaturalByLimbsAndBits(bn, totalNumberOfBitsToShift, result) {
    const numberOfLimbsToShift = Math.floor(totalNumberOfBits / BARE_LIMB_LEN);
    const numberOfBitsToShift = (totalNumberOfBitsToShift % BARE_LIMB_LEN);
    if (numberOfBitsToShift > 0) {
        _shiftLeftBigNaturalByBits(bn, numberOfBitsToShift, result);
    }
    if (numberOfLimbsToShift > 0) {
        _shiftLeftBigNaturalByLimbs(bn, numberOfLimbsToShift, result);
    }
    return result;
}

function _shiftRightBigNaturalByLimbsAndBits(bn, totalNumberOfBitsToShift, result) {
    const numberOfLimbsToShift = Math.floor(totalNumberOfBits / BARE_LIMB_LEN);
    const numberOfBitsToShift = (totalNumberOfBitsToShift % BARE_LIMB_LEN);
    if (numberOfLimbsToShift > 0) {
        _shiftRightBigNaturalByLimbs(bn, numberOfLimbsToShift, result);
    }
    if (numberOfBitsToShift > 0) {
        _shiftRightBigNaturalByBits(bn, numberOfBitsToShift, result);
    }
    return result;
}

function _shiftBigNaturalByLimbsAndBits(bn, totalNumberOfBitsToShiftLeft, result) {
    const numberOfLimbsToShiftLeft = Math.floor(totalNumberOfBits / BARE_LIMB_LEN);
    const numberOfBitsToShiftLeft = (totalNumberOfBitsToShift % BARE_LIMB_LEN);
    if (totalNumberOfLimbsToShiftLeft > 0) {
        _shiftLeftBigNaturalByLimbsAndBits(bn, totalNumberOfBitsToShiftLeft, result);
    } else if (totalNumberOfBitsToShiftLeft < 0) {
        const totalNumberOfBitsToShiftRight = -totalNumberOfBitsToShiftLeft;
        _shiftRightBigNaturalByLimbsAndBits(bn, totalNumberOfBitsToShiftRight, result);
    }
    return result;
}

function multiplyBigNaturals(bnA, bnB) {
    const result = new BigNatural(bnA._numberOfLimbs + bnB.numberOfLimbs);
    const bnBmutable = new BigNatural(bnA._numberOfLimbs + bnB.numberOfLimbs);
    _copyBigNatural(bnB, bnBmutable);
    return _multiplyBigNaturals(bnA, bnBmutable, result);
}

function _multiplyBigNaturals(bnA, bnBmutable, result) {
    // algorithm outline:
    //   * iterate over the bits of A, 
    //   * going from least- to most-significant bit, 
    //   * in case the A-bit is one: add B to the result, 
    //   * in case the A-bit is zero: do nothing, 
    //   * shift B to the left for the next iteration
    result._numberOfLimbs = 0;
    const numberOfLimbsA = bnA._numberOfLimbs;
    const limbsA = bnA._limbs;
    let currLimbIndex = 0;
    let currBitIndexWithinCurrLimb = 0;
    for (let i = 0; i < numberOfLimbsA; i++) {
        const limbA = limbsA[i];
        for (let j = 0; j < BARE_LIMB_LEN; j++)) {
            const bitA = (limbA >> j) & 1;
            if (bitA === 1) {
                __addBigNaturals(bnBmutable, result, result);
            }
            _shiftLeftBigNatural(bnBmutable, bnBmutable);
        }
    }
    return result;
}

function multiplyBigNaturals(bnA, bnB) {
    const result = new BigNatural(bnA._numberOfLimbs + bnB.numberOfLimbs);
    const bnBmutable = new BigNatural(bnA._numberOfLimbs + bnB.numberOfLimbs);
    _copyBigNatural(bnB, bnBmutable);
    return _multiplyBigNaturals(bnA, bnBmutable, result);
}

function _multiplyBigNaturals(bnA, bnBmutable, result) {
    // algorithm outline:
    //   * iterate over the bits of A, 
    //   * going from least- to most-significant bit, 
    //   * in case the A-bit is one: add B to the result, 
    //   * in case the A-bit is zero: do nothing, 
    //   * shift B to the left for the next iteration
    result._numberOfLimbs = 0;
    const numberOfLimbsA = bnA._numberOfLimbs;
    const limbsA = bnA._limbs;
    let currLimbIndex = 0;
    let currBitIndexWithinCurrLimb = 0;
    for (let i = 0; i < numberOfLimbsA; i++) {
        const limbA = limbsA[i];
        for (let j = 0; j < BARE_LIMB_LEN; j++)) {
            const bitA = (limbA >> j) & 1;
            if (bitA === 1) {
                __addBigNaturals(bnBmutable, result, result);
            }
            _shiftLeftBigNatural(bnBmutable, bnBmutable);
        }
    }
    return result;
}

function bigNaturalIsZero(bn) {
    return (bn._numberOfLimbs === 0);
}

function mostSignificantBitIndexInLimb(limb) {
    let bitIndex = 0;
    let bit = 1;
    while (bitIndex < BARE_LIMB_LEN && (limb & bit === 0)) {
        bitIndex++;
        bit = bit << 1;
    }
    return bitIndex;
}
    
function _divideBigNaturals(dividentmutable, divisormutable, result) {
    // algorithm outline:
    //   * line up the divisor with the divident, 
    //   * subtract the exponentiated divisor from 
    //     the divident to get the intermedidate 
    //     remainder, 
    //   * write down the result bit which will
    //     be the one that corresponds to 
    //     the place we lined up the exponentiated
    //     divisor to
    //   * recurse (conceptually) with the intermediate 
    //     remainder taking the role of the divident
    let totalNumberOfBitsByWhichTheDivisorWasShifted = 0;
    do {
        const numberOfDivisorLimbs = divisormutable._numberOfLimbs;
        if (numberOfDivisorLimbs === 0) {
            throw new Error(`division by zero`);
        }
        const numberOfDividentLimbs = dividentmutable._numberOfLimbs;
        if (numberOfDividentLimbs === 0) {
           return; // natural long division is done, remainder is zero
        }
        const dividentLimbs = divident._limbs;
        const divisorLimbs = divisor._limbs;
        const lastDividentLimb = dividentLimbs[numberOfDividentLimbs];
        const lastDivisorLimb = dividentLimbs[numberOfDividentLimbs];
        const msbIndexInLastDividentLimb = mostSignificantBitIndexInLimb(lastDividentLimb);
        const msbIndexInLastDivisorLimb = mostSignificantBitIndexInLimb(lastDivisorLimb);
        const expDivident = (numberOfDividentLimbs-1) * BARE_LIMB_LEN + msbIndexInLastDividentLimb;
        const expDivisor = (numberOfDivisorLimbs-1) * BARE_LIMB_LEN + msbIndexInLastDivisorLimb;
        const expDistanceBetweenDividentAndDivisor = expDivident - expDivisor;
        if (expDistanceBetweenDividentAndDivisor < -totalNumberOfBitsByWhichTheDivisorWasShifted) {
            return; // natural long division is done, divident contains the remainder
        }
        _shiftBigNaturalByLimbsAndBits(
            divisormutable, expDistanceBetweenDividentAndDivisor, divisormutable);
        totalNumberOfBitsByWhichTheDivisorWasShifted += expDistanceBetweenDividentAndDivisor;
        if (bigNaturalIsLargerThanOrEqualTo(dividentmutable, divisormutable)) {
            // divisor has the same exponent and is less than or equal to the divident 
            // the same exponent means the most significant bit for both is 1
            // from this it follows that the difference between the divident and the divisor
            // is strictly less than half the divisor (if all the remaining bits differ it
            // will still be one less than the value of the most significant bit)
            // so strictly less than twice and at least one times
            // it follows the divisor will fit the divident exactly once
            _subtractBigNaturals(dividentmutable, divisormutable, dividentmutable);
            _addPowerOfTwoToBigNatural(totalNumberOfBitsByWhichTheDivisorWasShifted, result);
            // the intermediate remainder will now be strictly less than the shifted divisor 
            // so we need not subtract the shifted divisor further in this position 
            // this step in the long division is done, 
            // we can recurse and (possibly) continue to the next position
        } else {
            // divisor has the same exponent but is strictly bigger than the divident 
            // see if we can shift back one bit: 
            if (-1 < -totalNumberOfBitsByWhichTheDivisorWasShifted) {
                return; // natural long division is done, divident contains the remainder
            }
            // we can shift:
            _shiftRightBigNatural(divisormutable, divisormutable);
            totalNumberOfBitsByWhichTheDivisorWasShifted -= 1;
            // this will have cut divisor in half (the bit shifted out was guaranteed zero)
            // half of something strictly bigger is still strictly bigger than half of that something
            // so if the whole divisor didn't fit the divident once or more
            // then half the divisor will not fit the divident twice or more
            // also, the exponent of divisor is now 1 less than the exponent of divident
            // this means the divisor will fit at least once in the divident
            // so strictly less than twice and at least one times
            // it follows the divisor will fit the divident exactly once
            // we can subtract once:
            _subtractBigNaturals(dividentmutable, divisormutable, dividentmutable);
            _addPowerOfTwoToBigNatural(totalNumberOfBitsByWhichTheDivisorWasShifted, result);
            // the intermediate remainder will now be strictly less than the shifted divisor 
            // so we need not subtract the shifted divisor further in this position
            // this step in the long division is done, 
            // we can recurse and (possibly) continue to the next position
        }  
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