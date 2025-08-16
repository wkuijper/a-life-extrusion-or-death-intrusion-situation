/** A `BigFloatSystem` wraps a {@link LimbicSystem} to allow representation
 * of, and operations on, arbitrary precision floating point numbers.
 *
 * A floating point number (big or otherwise) represents an approximation to
 * a real number as a binary expansion. In general, all floating point numbers
 * consist of a signed exponent and a signed mantissa. 
 *
 * For a given signed exponent and a given signed mantissa the value 
 * represented is then:
 *
 *         x = 2^exp * mantissa
 *
 * For example, `exp = -110b (-6)` and `mantissa = +10110b (+22)` represent
 * the number:
 *
 *         x = 2^-6 * 22 = 1/64 * 22 = 0.34375
 *
 * In binary the representation looks like:
 *
 *         x = (-110b, +10110b)
 *              \___/  \_____/
 *                |       |
 *               exp   mantissa
 *
 * We can visualize this on a binary expansion line that conceptually 
 * extends infinitely far to the left and infinitely far to the right 
 * with the origin correponding to the zero-exponent: 2^0 = 1.
 *
 * Because we normally write numbers with the increasingly significant 
 * digits to the left and decreasingly significant digits to the right, 
 * the line runs from positive exponent values on the left to negative 
 * exponent values on the right.
 *
 * For our example:
 *
 *                              @.@ 1 0 1 1 0 
 *    _____________________________________________________            
 *      | ' ' ' | ' ' ' | ' ' ' | ' ' ' | ' ' ' | ' ' ' |
 *     12       8       4       0      -4  -6  -8      -12    <-- exp
 *
 * Where @ denotes implicit zeroes.
 *
 * Since 2^0 = 1 the origin corresponds to the digit value 1. The exponent 
 * -1 then corresponds to the digit value 2^-1 = 1/2 which places the usual 
 * notion of the floating point, that is, the point where whole digit values 
 * become rational digit values, precisely at exponent value -1/2
 * 
 * Note that, tellingly, 2^-1/2 = 1/sqrt(2) is the scaling factor
 * that preserves Euclidian distance after a rotation of 45 degrees 
 * around the origin. 
 * 
 * But since we can't represent rational exponents with simple floats, 
 * we'll need to postpone dealing with such irrational numbers until we can 
 * start forming real expressions.
 *
 * For the moment we can note that this is the main goal for which we need 
 * arbitrary precision floating point numbers: we can use them to approximate 
 * the type of (irrational) real numbers that arise when we start considering 
 * geometric transformations, like rotations.
 *
 * Back to our example, we note that the @ signs stand for implicit zeros: 
 * the first @ corresponding to exponent value 0 and the second @ corresponding
 * to exponent value -1.
 *
 * Since 2^0 = 1 and 2^-1 = 1/2 this corresponds to the fact that our 
 * example number is strictly smaller than 1/2 and has no significant 
 * digits in the mantissa corresponding to digit values 1 and 1/2.
 * 
 * With the visualization we see that each digit has its own exponent value 
 * associated to it. 
 * 
 * In particular, Our example number can alternatively be written:
 *
 *      x = 1*2^-2 + 0*2^-3 + 1*2^-4 + 1*2^-5 + 0*2^-6
 *        =   1/4  +    0   +  1/16  +  1/32 +   0
 *        = 0.25 + 0.0625 + 0.03125
 *        = 0.34375
 *
 * And we see that the exponent of the float (exp = -6) corresponds to 
 * the digit value (2^-6 = 1/64) of the least significant digit of the 
 * mantissa.
 *
 * Note that the least significant digit is zero, so it does not contribute
 * to the value. But it is important to represent it nonetheless. 
 *
 * The reason is that these trailing zeros still say something about the 
 * precision of the number. 
 *
 * Since floating point numbers approximate real numbers it is important to 
 * keep track of how precise the approximation is. 
 *
 * In that context, the binary expansion:
 *
 *         a = @.@@1000
 *
 * Is not the same as the binary expansion:
 * 
 *         b = @.@@10
 *
 * Because the first has 4 significant binary digits, and the second has only
 * two. 
 *
 * Concretely, if the numbers are interpreted as underapproximations of some
 * real values r_a and r_b then we get:
 *
 *         a <= r_a <= a + @.@@0001
 *
 * So, r_a is confined to a narrow interval. For b this interval is bigger:
 *
 *         b <= r_b <= b + @.@@01
 *
 * For *over*approximations it would work the same but in the other direction.
 *
 * Staying with underapproximations for the moment, all this this 
 * means we cannot commit to a sequence of 1's in a binary expansion until 
 * we've seen at least one trailing 0.
 * 
 * To see this, consider the following example: 
 *
 *         c = @.@@100111
 *
 * Interpreted as an underapproximation of some real number r_c, this float
 * represents the interval:
 *
 *         c <= r_c <= c + @.@@000001 = @.@@101000
 *
 * As can be seen: the last four digits of c fliped on the high end of the
 * interval it represents.
 *
 * Note that this flipping cannot be avoided, in general, because cutting off
 * additions/subtractions will, at least sometimes, involve an unknown carry.
 *
 * The latter is why *trailing* zeroes must be considered significant. 
 *
 * On the other hand, up to now, none of our examples featured significant 
 * *leading* zeroes.
 *
 * In most machine floating point representations, leading zeroes are 
 * suppressed, meaning they are absorbed into the exponent and turned into
 * implicit zeroes for every intermediate result. 
 *
 * This is called *normalization*.
 *
 * However, in addition to absorbing leading zeroes, normalization of
 * fixed precision machine floats also adds trailing zeroes which are
 * then counted as significant digits.
 *
 * For our purposes, we cannot do this because 
 * this would not properly reflect the significance of our numbers.
 *
 * Consider, for example, the following subtraction:
 *
 *                  1 0 0 0 0 0 0.0 0 1
 *                              @.@ 1 0 1 1 0
 *    _____________________________________________________           
 *      | ' ' ' | ' ' ' | ' ' ' | ' ' ' | ' ' ' | ' ' ' |
 *     12       8       4       0      -4      -8      -12 
 *
 * That is: we're subtracting two normalized numbers with partially 
 * overlapping significant digits.
 *
 * The question is how many significant digits the result should have.
 *
 * If we carry out the subtraction in underapproximating mode we have
 * to start from the least significant digit of the larger number and
 * assume a negative carry coming in from the right:
 *
 *                   -1-1-1-1-1-1-1  -1: 
 *                  1 0 0 0 0 0 0.0 0 1:? ? ?
 *                              @.@ 1 0:1 1 0
 *              -----------------------:----- -
 *                  0 1 1 1 1 1 1 1 0 0:
 *    _____________________________________________________           
 *      | ' ' ' | ' ' ' | ' ' ' | ' ' ' | ' ' ' | ' ' ' |
 *     12       8       4       0      -4      -8      -12
 *
 * If we call the larger number `y` and the smaller number `x` (as before)
 * we get:
 *
 *      x = 
 * The underlying limbic system determines the representation of the BigFloat
 * floating point numbers in the following way:
 *
 *         +/- exp +/-
 */
class BigFloatSystem {

    constructor(limbicSystem) {
        this.limbicSystem = limbicSystem;
    }

    makeZero(precision) {
        return new BigFloat(this, precision);
    }

    compare(a, b) {
        const expA = a._exp;
        const expB = b._exp;
        const signAB = a._sign * b._sign;
        if (expA > expB) {
            return signAB;
        }
        if (expA < expB) {
            return -signAB;
        }
        const limbsA = a._limbs;
        const limbsB = b._limbs;
        const numberOfLimbsA = limbsA.length;
        const numberOfLimbsB = limbsB.length;
        if (numberOfLimbsA < numberOfLimbsB) {
            for (let i = 0; i < numberOfLimbsA; i++) {
                const limbA = limbsA[i];
                const limbB = limbsB[i];
                if (limbA < limbB) {
                    return -signAB;
                }
                if (limbA > limbB) {
                    return signAB;
                }
            }
            for (let j = numberOfLimbsA; j < numberOfLimbsB; j++) {
                const limbA = 0;
                const limbB = limbsB[i];
                if (limbA < limbB) {
                    return -signAB;
                }               
            }
        } else {
            for (let i = 0; i < numberOfLimbsB; i++) {
                const limbA = limbsA[i];
                const limbB = limbsB[i];
                if (limbA < limbB) {
                    return -signAB;
                }
                if (limbA > limbB) {
                    return signAB;
                }
            }
            for (let j = numberOfLimbsB; j < numberOfLimbsA; j++) {
                const limbA = limbsA[j];
                const limbB = 0;
                if (limbA > limbB) {
                    return -signAB;
                }               
            }
        }
        return 0;
    }
    
    add(a, b, overapproximate) {
        const signA = a._sign;
        const signB = b._sign;
        if (signA === 0) {
            return b;
        } else if (signA < 0) {
            if (signB === 0) {
                return a;
            } else if (signB < 0) {
                this._add(a.negate(), b.negate(), !overapproximate).negate();
            } else /* (signB > 0) */ {
                const negatedA = a.negate();
                const compMagnAB = this.compare(negatedA, b);
                if (compMagnAB === 0) {
                    return this._makeZero(Math.min(a.precision, b.precision));
                } else if (compMagnAB < 0) {
                    return this._subtract(b, negatedA, overapproximate);
                } else /* compMagnAB > 0 */ {
                    return this._subtract(negatedA, b, !overapproximate).negate();
                }
            }
        } else /* signA > 0 */ {
            if (signB === 0) {
                return a;
            } else if (signB < 0) {
                const negatedB = b.negate();
                const compMagnAB = this.compare(a, negatedB);
                if (compMagnAB === 0) {
                    return this._makeZero(Math.min(a.precision, b.precision));
                } else if (compMagnAB < 0) {
                    return this._subtract(negatedB, a, overapproximate).negate();
                } else /* compMagnAB > 0 */ {
                    return this._subtract(a, negatedB, !overapproximate);
                }
            } else /* (signB > 0) */ {
                return this._add(b, a, overapproximate);
            }
        }
    }

    subtract(a, b, overapproximate) {
        const signA = a._sign;
        const signB = b._sign;
        if (signA === 0) {
            return b;
        } else if (signA < 0) {
            if (signB === 0) {
                return a;
            } else if (signB < 0) {
                const negatedA = a.negate();
                const negatedB = b.negate();
                const compMagnAB = this.compare(negatedA, negatedB);
                if (compMagnAB === 0) {
                    return this._makeZero(Math.min(a.precision, b.precision));
                } else if (compMagnAB < 0) {
                    return this._subtract(negatedB, negatedA, overapproximate);
                } else /* compMagnAB > 0 */ {
                    return this._subtract(negatedA, negatedB, !overapproximate).negate();
                }
            } else /* (signB > 0) */ {
                const negatedA = a.negate();
                return this._add(negatedA, b, !overapproximate).negate();
            }
        } else /* signA > 0 */ {
            if (signB === 0) {
                return a;
            } else if (signB < 0) {
                const negatedB = b.negate();
                return this._add(a, negatedB, overapproximate);
            } else /* (signB > 0) */ {
                const compMagnAB = this.compare(a, b);
                if (compMagnAB === 0) {
                    return this._makeZero(Math.min(a.precision, b.precision));
                } else if (compMagnAB < 0) {
                    return this._subtract(b, a, !overapproximate).negate();
                } else /* compMagnAB > 0 */ {
                    return this._subtract(a, b, overapproximate);
                }
            }
        }
    }

    
}

class BigFloat {

    get precision() {
        return this._limbs.length;
    }
    
    constructor(precision) {
        this._limbs = new Uint32Array(precision);
        this._exp = 0;
        this._sign = 0;
    }

}