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
        if (nextLen < this._bareLimbLen) {
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
        const remainingLen = this._bareLimbLen - currLen;
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
            while (remainingNumberOfBits >= this._bareLimbLen) { // <-- overkill for 32 bits
                const mask = ((1 << this._bareLimbLen) - 1);
                const finishedLimb = (remainigWord & mask);
                this._addFinishedLimb(finishedLimb);
                remainingWord = remainigWord >> this._bareLimbLen;
                remainingNumberOfBits = remainingNumberOfBits - this._bareLimbLen;
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

class LimbicSystem {

    constructor(bareLimbLen) {
        // 28 bits is a multiple of 4 and fits safely in a javascript number 
        // (js numbers have 32 bits max for well-defined bitwise operations
        // but using all 32 bits would be too many because we need to be able 
        // to overflow, we want a multiple of 4 to be able to convert to hex)
        if (bareLimbLen === undefined) {
            bareLimbLen = 28;
        }
        if (Math.floor(bareLimbLen) !== bareLimbLen) {
            throw new Error(`bare limb length must be integer`);
        }
        if (bareLimbLen <= 0) {
            throw new Error(`bare limb length must be nonzero`);
        }
        if (bareLimbLen > 28) {
            throw new Error(`bare limb length must be less than or equal to 28`);
        }
        if (bareLimbLen % 4 !== 0) {
            throw new Error(`bare limb length must be a multiple of 4`);
        }
        
        const bareLimbLen = bareLimbLen;  
        const bareLimbLenMinusOne = bareLimbLen - 1;
        const extendedLimbOverflow = 1 << bareLimbLen;
        const bareLimbMask = extendedLimbOverflow - 1; // Mask of all 1 bits
        
        this._bareLimbLen = bareLimbLen;
        this._bareLimbLenMinusOne = bareLimbLenMinusOne
        this._extendedLimbOverflow = extendedLimbOverflow
        this._bareLimbMask = bareLimbMask;
    }
    
}

class BigNaturalSystem {

    constructor(limbicSystem) {
        this._limbicSystem = limbicSystem;
        // transfer constants for efficiency
        this._bareLimbLen = limbicSystem._bareLimbLen;
        this._bareLimbLenMinusOne = limbicSystem._bareLimbLenMinusOne
        this._extendedLimbOverflow = limbicSystem._extendedLimbOverflow
        this._bareLimbMask = limbicSystem._bareLimbMask;
    }
    
    _add(argA, argB, result) {
        const numberOfLimbsA = argA._numberOfLimbs;
        const numberOfLimbsB = argB._numberOfLimbs;
        const longerB = (numberOfLimbsB > numberOfLimbsA);
        const minimalRequiredCapacity = longerB ? numberOfLimbsB + 1 : numberOfLimbsA + 1;
        result._accomodate(minimalRequiredCapacity);
        const arg1 = longerB ? argB : argA;
        const arg2 = longerB ? argA : argB;
        return this.__add(arg1, arg2, result);
    }
    
    __add(arg1, arg2, result) {
        // precondition: arg1._numberOfLimbs >= arg2._numberOfLimbs
        // precondition: result capacity >= 1 + Math.max(arg1._numberOfLimbs + arg2._numberOfLimbs);
        const numberOfLimbs1 = arg1._numberOfLimbs;
        const numberOfLimbs2 = arg2._numberOfLimbs;
        const limbs1 = arg1._limbs;
        const limbs2 = arg2._limbs;
        const resultLimbs = result._limbs;
        let carry = 0;
        // first add all the common limbs
        // note: numberOfLimbs2 <= numberOfLimbs1
        for (let i = 0; i < numberOfLimbs2; i++) { 
            const limb1 = limbs1[i];
            const limb2 = limbs2[i];
            const sum = carry + limb1 + limb2;
            const limb = sum & this._bareLimbMask;
            resultLimbs[i] = limb;
            carry = sum >> this._bareLimbLen;
        }
        // next add the remaining limbs
        // note: numberOfLimbs1 >= numberOfLimbs2
        for (let i = numberOfLimbs2; i < numberOfLimbs1; i++) { 
            const limb1 = limbs1[i];
            const sum = carry + limb1;
            const limb = sum & this._bareLimbMask;
            resultLimbs[i] = limb;
            carry = sum >> this._bareLimbLen;
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
    
    _incrementWithPowerOfTwo(argmutable, exp) {
        // pre-condition: exp >= 0
        // pre-condition: argmutable capacity fits the result of adding 2^exp
        const numberOfLimbs = argmutable._numberOfLimbs;
        const limbs = argmutable._limbs;
        const expPlusOne = exp + 1;
        const numberOfVirtualLimbs = math.ceil(expPlusOne / this._bareLimbLen);
        const minimalRequiredNumberOfLimbs = Math.max(numberOfLimbs, numberOfVirtualLimbs);
        if (limbs.length < minimalRequiredNumberOfLimbs) {
            const maximalRequiredNumberOfLimbs = minimalRequiredNumberOfLimbs + 1;
            argmutable.accomdate(maximalRequiredNumberOfLimbs);
        }
        for (let i = numberOfLimbs; i < minimalRequiredNumberOfLimbs; i++) {
            limbs[i] = 0;
        }
        const numberOfVirtualLimbsMinus1 = numberOfVirtualLimbs - 1;
        const expInMostSignificantVirtualLimb = exp - (numberOfVirtualLimbsMinus1 * this._bareLimbLen); 
        let carry = 1 << expInMostSignificantVirtualLimb;
        let currLimbIndex = numberOfVirtualLimbsMinus1;
        do {
            const currLimb = currLimbIndex < minimalRequiredNumberOfLimbs ? limbs[currLimbIndex] : 0;
            const extIncLimb = currLimb + carry;
            const nextCarry = (extLimb & this._extendedLimbOverflow) >> this._bareLimbLen;
            carry = nextCarry;
            const bareIncLimb = extLimb & this._bareLimbMask;
            limbs[currLimbIndex] = bareIncLimb;
            currLimbIndex++;
        } while (carry > 0);
        argmutable._numberOfLimbs = currLimbIndex;
        return argmutable;
    }
    
    _compare(argA, argB) {
        const numberOfLimbsA = argA._numberOfLimbs;
        const numberOfLimbsB = argB._numberOfLimbs;
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
        const limbsA = argA._limbs;
        const limbsB = argA._limbs;
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
    
    _subtract(arg1, arg2, result) {
        // precondition: arg1 >= arg2 
        // (which implies arg1._numberOfLimbs >= arg2._numberOfLimbs)
        const numberOfLimbs1 = arg1._numberOfLimbs;
        const numberOfLimbs2 = arg2._numberOfLimbs;
        const limbs1 = arg1._limbs;
        const limbs2 = arg2._limbs;
        result.accomodate(numberOfLimbs1);
        const resultLimbs = result._limbs;
        let carry = 0;
        // first subtract all the common limbs
        // note: numberOfLimbs2 <= numberOfLimbs1
        for (let i = 0; i < numberOfLimbs2; i++) { 
            const limb1 = limbs1[i];
            const limb2 = limbs2[i];
            const diff = (limb1 | this._extendedLimbOverflow) - (limb2 + carry);
            const limb = diff & this._bareLimbMask;
            resultLimbs[i] = limb;
            carry = (~diff) >> this._bareLimbLen;
        }
        // next subtract all but the last of the remaining limbs
        // note: numberOfLimbs1 >= numberOfLimbs2
        const numberOfLimbs1minus1 = numberOfLimbs1 - 1;
        for (let i = numberOfLimbs2; i < numberOfLimbs1minus1; i++) {
            const limb1 = limbs1[i];
            const diff = (limb1 | this._extendedLimbOverflow) - carry;
            const limb = diff & this._bareLimbMask;
            resultLimbs[i] = limb;
            carry = (~diff) >> this._bareLimbLen;
        }
        // finally subtract the last limb
        // and set the correct number of result limbs
        const lastLimb1 = limbs1[numberOfLimbs1minus1];
        // invariant: lastLimb !== 0
        const lastDiff = (lastLimb1 | this._extendedLimbOverflow) - carry;
        const lastResultLimb = lastDiff & this._bareLimbMask;
        // invariant: carry must be zero because lastLimb !== 0
        if (lastResultLimb === 0) {
            result._numberOfLimbs = numberOfLimbs1minus1;  
        } else {
            resultLimbs[numberOfLimbs1minus1] = lastResultLimb;
            result._numberOfLimbs = numberOfLimbs1;
        }
        return result;
    }
    
    _shiftRight(arg, result) {
        const numberOfLimbs = arg._numberOfLimbs;
        const limbs = arg._limbs;
        result.accomodate(numberOfLimbs);
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
            const resultLimb = (limb >> 1) | (carry << this._bareLimbLenMinusOne);
            resultLimbs[i] = resultLimb;
            carry = nextCarry;
        }
        return result;
    }
    
    _shiftRightBigNaturalByBits(arg, numberOfBitsToShift, result) {
        // precondition: numberOfBitsToShift < this._bareLimbLen
        const numberOfLimbs = arg._numberOfLimbs;
        const limbs = arg._limbs;
        const resultLimbs = result._limbs;
        // shift the most significant limb first
        const numberOfBitsToUnshift = this._bareLimbLen - numberOfBitsToShift;
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
    
    _shiftRightBigNaturalByLimbs(arg, numberOfLimbsToShift, result) {
        const numberOfLimbs = arg._numberOfLimbs;
        const numberOfRemainingLimbs = 
            Math.max(0, numberOfLimbs - numberOfLimbsToShift);
        const limbs = arg._limbs;
        const resultLimbs = result._limbs;
        // shifted the limbs
        for (let i = 0; i < numberOfRemainingLimbs; i++) {
            resultLimbs[i] = limbs[i + numberOfLimbsToShift];
        }
        result._numberOfLimbs = numberOfRemainingLimbs;
        return result;
    }
    
    _shiftLeftBigNatural(arg, result) {
        // precondition: capacity of result is one greater than the number of limbs in arg
        const numberOfLimbs = arg._numberOfLimbs;
        const limbs = arg._limbs;
        const resultLimbs = result._limbs;
        // shift the limbs from the least significant to the most significant
        const carryMask = 1 << (this._bareLimbLenMinusOne);
        let carry = 0;
        for (let i = 0; i < numberOfLimbs; i++) {
            const limb = limbs[i];
            const nextCarry = (limb & carryMask) >> this._bareLimbLenMinusOne; 
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
    
    _shiftLeftBigNaturalByBits(arg, numberOfBitsToShift, result) {
        // precondition: numberOfBitsToShift < this._bareLimbLen
        // precondition: capacity of result is one greater than the number of limbs in arg
        const numberOfLimbs = arg._numberOfLimbs;
        const limbs = arg._limbs;
        const resultLimbs = result._limbs;
        // shift the limbs from the least significant to the most significant
        const numberOfBitsToUnshift = this._bareLimbLen - numberOfBitsToShift;
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
    
    _shiftLeftBigNaturalByLimbs(arg, numberOfLimbsToShift, result) {
        // precondition: numberOfLimbsToShift < arg._numberOfLimbs
        // precondition: capacity of result is numberOfLimbs + numberOfLimbsToShift
        const numberOfLimbs = arg._numberOfLimbs;
        const limbs = arg._limbs;
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
    
    _shiftLeftBigNaturalByLimbsAndBits(arg, totalNumberOfBitsToShift, result) {
        const numberOfLimbsToShift = Math.floor(totalNumberOfBits / this._bareLimbLen);
        const numberOfBitsToShift = (totalNumberOfBitsToShift % this._bareLimbLen);
        if (numberOfBitsToShift > 0) {
            _shiftLeftBigNaturalByBits(arg, numberOfBitsToShift, result);
        }
        if (numberOfLimbsToShift > 0) {
            _shiftLeftBigNaturalByLimbs(arg, numberOfLimbsToShift, result);
        }
        return result;
    }
    
    _shiftRightBigNaturalByLimbsAndBits(arg, totalNumberOfBitsToShift, result) {
        const numberOfLimbsToShift = Math.floor(totalNumberOfBits / this._bareLimbLen);
        const numberOfBitsToShift = (totalNumberOfBitsToShift % this._bareLimbLen);
        if (numberOfLimbsToShift > 0) {
            _shiftRightBigNaturalByLimbs(arg, numberOfLimbsToShift, result);
        }
        if (numberOfBitsToShift > 0) {
            _shiftRightBigNaturalByBits(arg, numberOfBitsToShift, result);
        }
        return result;
    }
    
    _shiftBigNaturalByLimbsAndBits(arg, totalNumberOfBitsToShiftLeft, result) {
        const numberOfLimbsToShiftLeft = Math.floor(totalNumberOfBits / this._bareLimbLen);
        const numberOfBitsToShiftLeft = (totalNumberOfBitsToShift % this._bareLimbLen);
        if (totalNumberOfLimbsToShiftLeft > 0) {
            _shiftLeftBigNaturalByLimbsAndBits(arg, totalNumberOfBitsToShiftLeft, result);
        } else if (totalNumberOfBitsToShiftLeft < 0) {
            const totalNumberOfBitsToShiftRight = -totalNumberOfBitsToShiftLeft;
            _shiftRightBigNaturalByLimbsAndBits(arg, totalNumberOfBitsToShiftRight, result);
        }
        return result;
    }
    
    multiplyBigNaturals(argA, argB) {
        const result = new BigNatural(argA._numberOfLimbs + argB.numberOfLimbs);
        const argBmutable = new BigNatural(argA._numberOfLimbs + argB.numberOfLimbs);
        _copyBigNatural(argB, argBmutable);
        return _multiplyBigNaturals(argA, argBmutable, result);
    }
    
    _multiplyBigNaturals(argA, argBmutable, result) {
        // algorithm outline:
        //   * iterate over the bits of A, 
        //   * going from least- to most-significant bit, 
        //   * in case the A-bit is one: add B to the result, 
        //   * in case the A-bit is zero: do nothing, 
        //   * shift B to the left for the next iteration
        result._numberOfLimbs = 0;
        const numberOfLimbsA = argA._numberOfLimbs;
        const limbsA = argA._limbs;
        let currLimbIndex = 0;
        let currBitIndexWithinCurrLimb = 0;
        for (let i = 0; i < numberOfLimbsA; i++) {
            const limbA = limbsA[i];
            for (let j = 0; j < this._bareLimbLen; j++)) {
                const bitA = (limbA >> j) & 1;
                if (bitA === 1) {
                    __addBigNaturals(argBmutable, result, result);
                }
                _shiftLeftBigNatural(argBmutable, argBmutable);
            }
        }
        return result;
    }
    
    multiplyBigNaturals(argA, argB) {
        const result = new BigNatural(argA._numberOfLimbs + argB.numberOfLimbs);
        const argBmutable = new BigNatural(argA._numberOfLimbs + argB.numberOfLimbs);
        _copyBigNatural(argB, argBmutable);
        return _multiplyBigNaturals(argA, argBmutable, result);
    }
    
    _multiplyBigNaturals(argA, argBmutable, result) {
        // algorithm outline:
        //   * iterate over the bits of A, 
        //   * going from least- to most-significant bit, 
        //   * in case the A-bit is one: add B to the result, 
        //   * in case the A-bit is zero: do nothing, 
        //   * shift B to the left for the next iteration
        result._numberOfLimbs = 0;
        const numberOfLimbsA = argA._numberOfLimbs;
        const limbsA = argA._limbs;
        let currLimbIndex = 0;
        let currBitIndexWithinCurrLimb = 0;
        for (let i = 0; i < numberOfLimbsA; i++) {
            const limbA = limbsA[i];
            for (let j = 0; j < this._bareLimbLen; j++)) {
                const bitA = (limbA >> j) & 1;
                if (bitA === 1) {
                    __addBigNaturals(argBmutable, result, result);
                }
                _shiftLeftBigNatural(argBmutable, argBmutable);
            }
        }
        return result;
    }
    
    bigNaturalIsZero(arg) {
        return (arg._numberOfLimbs === 0);
    }
    
    mostSignificantBitIndexInLimb(limb) {
        let bitIndex = 0;
        let bit = 1;
        while (bitIndex < this._bareLimbLen && (limb & bit === 0)) {
            bitIndex++;
            bit = bit << 1;
        }
        return bitIndex;
    }
        
    _divideBigNaturals(dividentmutable, divisormutable, result) {
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
            const expDivident = (numberOfDividentLimbs-1) * this._bareLimbLen + msbIndexInLastDividentLimb;
            const expDivisor = (numberOfDivisorLimbs-1) * this._bareLimbLen + msbIndexInLastDivisorLimb;
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
}

class BigIntegerSystem {

    constructor(bigNaturalSystem) {
        this._bigNaturalSystem = bigNaturalSystem;
        const limbicSystem = bigNaturalSystem._limbicSystem.
        this._limbicSystem = limbicSystem;
    }
    
}

class BigNatural {

    constructor(bigNaturalSystem, initialCapacity) {
        this._system = bigNaturalSystem;
        this._limbs = Uint32Array(initialCapacity);
        this._numberOfLimbs = 0; // invariant: last limb is nonzero
    }
    
    isZero() {
        return this._numberOfLimbs === 0;
    }
    
    _accomodate(ensuredCapacity) {
        const currentCapacity = this._limbs.length;
        if (currentCapacity < ensuredCapacity) {
            const moreLimbs = Uint32Array(ensuredCapacity);
            const numberOfLimbs = this._numberOfLimbs;
            const limbs = this._limbs;
            for (let i = 0; i < numberOfLimbs; i++) {
                moreLimbs = limbs[i];
            }
            this._limbs = moreLimbs;
        }
    }
}

class BigInteger {

    getSign() {
        if (this._magnitude.isZero()) {
            return 0;
        }
        return this._nonZeroSign;
    }
    
    constructor(bigIntegerSystem, magnitudeAsBigNatural) {
        this._system = bigIntegerSystem;
        this._magnitude = magnitudeAsBigNatural;
        this._nonZeroSign = 1;
    }

}

class BigRational {

    getSign() {
        const divisor = this._divisor;
        const divisorSign = divisor.getSign();
        if (divisorSign === 0) {
            return Number.NaN;
        }
        const divident = this._divident;
        const dividentSign = divident.getSign();
        if (dividentSign === 0) {
            return 0;
        }
        if (divisorSign > 0) {
            return dividentSign;
        } else /* divisorSign < 0 */ {
            return -dividentSign;
        }
    }
    
    constructor(bigRationalSystem, dividentAsBigInteger, divisorAsBigInteger) {
        this._system = bigRationalSystem;
        this._divident = dividentAsBigInteger;
        this._divisor = divisorAsBigInteger;
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