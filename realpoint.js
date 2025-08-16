/** A `BigFloatSystem` wraps a {@link BigNaturalSystem} to allow 
 * representation of-, and operations on, arbitrary precision floating 
 * point numbers.
 *
 * In our case, the magnitude of the floating point number will be 
 * represented as a big natural hence the need for a 
 * {@link BigNaturalSystem}.
 *
 * A floating point number (big or otherwise) represents an approximation to
 * a real number as a binary expansion. In general, all floating point numbers
 * consist of a signed exponent an unsigned significant (also called mantissa)
 * and an overall sign. 
 * 
 * For a given signed exponent, mantissa and sign (-1, 0 or 1) the value 
 * represented is then:
 *
 *         x = 2^exp * mantissa * sign
 *
 * For example, in binary notation, `exp = -110`, `mantissa = 10110` and 
 * `sign = 1`represent the following number in decimal notation:
 *
 *         x = 2^-6 * 22 * 1 = 1/64 * 22 = 0.34375
 *
 * Structurally, the representation looks like:
 *
 *         x = (-110, 10110, +1)
 *              \__/  \___/   |
 *               |      |     |
 *              exp mantissa sign
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
 *                               .@ 1 0 1 1 0 
 *    _____________________________________________________            
 *      | ' ' ' | ' ' ' | ' ' ' | ' ' ' | ' ' ' | ' ' ' |
 *     12       8       4       0      -4  -6  -8      -12    <-- exp
 *
 * Where the @ symbol denotes an implicit, leading zero occuring after the
 * point.
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
 * Back to our example, we note that @ sign stands for an implicit zero,
 * in this case at exponent value -1.
 *
 * Since 2^-1 = 1/2 this corresponds to the fact that our 
 * example number is strictly smaller than 1/2 and has no significant 
 * digit in the mantissa corresponding to digit value 1/2.
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
 * Since floating point numbers approximate real numbers, it is important to 
 * keep track of how precise the approximation is. 
 *
 * In that context, the binary expansion:
 *
 *         a = .@@1000
 *
 * Is not the same as the binary expansion:
 * 
 *         b = .@@10
 *
 * Because the first has 4 significant binary digits, and the second has only
 * two. 
 *
 * Concretely, if the numbers are interpreted as underapproximations of some
 * real values r_a and r_b then we get:
 *
 *         a <= r_a <= a + .@@0001
 *
 * So, r_a is confined to a narrow interval. For b this interval is bigger:
 *
 *         b <= r_b <= b + .@@01
 *
 * For *over*approximations it would work the same way except in the other 
 * direction.
 *
 * Staying with underapproximations for the moment, all this 
 * means we cannot commit to a sequence of 1's in a binary expansion until 
 * we've seen at least one trailing 0.
 * 
 * To see this, consider the following example: 
 *
 *         c = .@@100111
 *
 * Interpreted as an underapproximation of some real number r_c, this float
 * represents the interval:
 *
 *         c <= r_c <= c + .@@000001 = .@@101000
 *
 * As can be seen: the last four digits of c flipped on the high end of the
 * interval it represents.
 *
 * Note that this flipping cannot be avoided, in general, because cutting off
 * additions/subtractions will, at least sometimes, involve an unknown carry.
 *
 * The latter is why *trailing* zeroes must be considered significant: the
 * more trailing zeroes, the smaller the unknown carry.
 *
 * On the other hand, up to now, none of our examples featured significant 
 * *leading* zeroes.
 *
 * The reason for that is because leading zeroes never contribute
 * to the value nor to the precision of the value and are therefore 
 * absorbed into the exponent.
 *
 * In our notation on the exponent line that is equivalent to 
 * simply dropping all leading zeros before the point and converting 
 * all leading zeros after the point into @ signs.
 *
 * In either case, the latter is called *normalization*.
 *
 * In most fixed-precision machine floating point representations, 
 * normalization not only absorbs leading zeroes but also adds 
 * trailing zeroes. 
 *
 * For our purposes, we cannot do this because 
 * it would not properly reflect the significance of our numbers.
 *
 * Consider, for example, subtracting the following two numbers:
 *
 *                  1 0 0 0 0 0 0.0 0 1              <-- y
 *                               .@ 1 0 1 1 0        <-- x
 *    _____________________________________________________           
 *      | ' ' ' | ' ' ' | ' ' ' | ' ' ' | ' ' ' | ' ' ' |
 *     12       8       4       0      -4      -8      -12 
 *
 * That is: consider subtracting the two normalized numbers `x` 
 * and `y` with partially overlapping significant digits.
 *
 * The question is how many significant digits the result 
 * `z = y - x` should have.
 *
 * If we perform the subtraction in underapproximating mode we have
 * to start from the least significant digit of the larger number `y` 
 * and assume a negative carry coming in from the right:
 *
 *                   -1-1-1-1-1-1-1  -1 
 *                  1 0 0 0 0 0 0.0 0 1 ? ? ?      <-- y
 *                               .@ 1 0 1 1 0      <-- x
 *              ----------------------------- -
 *                  0 1 1 1 1 1 1.1 0 0            <-- z
 *    _____________________________________________________           
 *      | ' ' ' | ' ' ' | ' ' ' | ' ' ' | ' ' ' | ' ' ' |
 *     12       8       4       0      -4      -8      -12
 *
 * As can be seen: the result `z` is, numerically, almost equal to `y` 
 *
 * This is, of course, not surprising as `x` is very small compared to `y` 
 * and subtracting something very small from something very big quickly 
 * becomes negligeable.
 *
 * At the same time, because there was still some overlap, and because we 
 * could not neglect the negative carry (needed to keep the computation 
 * underapproximating) the value in `z` has flipped all but one of the 
 * digits in `x` and created a leading zero in the process.
 *
 * If we don't take very explicit control over rounding (which is not
 * possible with javascript floating point numbers) in most fixed 
 * precision normalization procedures our leading zero would
 * get converted to a trailing zero:
 *
 *                  0 1 1 1 1 1 1.1 0 0      <-- z: before normalization
 *                    1 1 1 1 1 1.1 0 0 0    <-- z0: too precise
 *    _____________________________________________________           
 *      | ' ' ' | ' ' ' | ' ' ' | ' ' ' | ' ' ' | ' ' ' |
 *     12       8       4       0      -4      -8      -12
 *
 * This would be too precise because we didn't know the first argument 
 * with a resolution of 2^-4 to start with, which would be required to 
 * conclude a trailing zero at that position.
 *
 * Instead, the right thing to do would be to just drop the trailing
 * zero, reducing the number of significant digits in the result:
 * 
 *                    1 1 1 1 1 1.1 0 0 0   <-- z0: too precise
 *                    1 1 1 1 1 1.1 0 0     <-- z1: conservative?
 *    _____________________________________________________           
 *      | ' ' ' | ' ' ' | ' ' ' | ' ' ' | ' ' ' | ' ' ' |
 *     12       8       4       0      -4      -8      -12
 * 
 * To see if this is sufficiently conservative, we can pick an example 
 * real number (still rational) for both `x` and `y` and check when the 
 * number of significant digits in `z` indeed ensures the real, underlying 
 * result remains within the interval, and when it does not.
 *
 * In particular we will denote with `z1` upto `z3` the result of 
 * progressively dropping more significant digits:
 * 
 *                    1 1 1 1 1 1.1 0 0 0   <-- z0: too precise
 *                    1 1 1 1 1 1.1 0 0     <-- z1: ?
 *                    1 1 1 1 1 1.1 0       <-- z2: ?
 *                    1 1 1 1 1 1.1         <-- z3: ?
 *    _____________________________________________________           
 *      | ' ' ' | ' ' ' | ' ' ' | ' ' ' | ' ' ' | ' ' ' |
 *     12       8       4       0      -4      -8      -12
 * 
 * So let's first write out `x` and `y` as well as their associated 
 * intervals in decimal notation:
 *
 *         y = 64 + 1/8 = 64.125
 *         x = 1/4 + 1/16 + 1/32 = 0.34375
 *         
 * Now we need to pick (rational) reals `r_y` and `r_x` such that:
 *
 *         64.125 = y <= r_y <= y + 1/8 = 64.25
 *         0.34375 = x <= r_x <= x + 1/64 = 0.359375
 *
 * Let pick `r_y = 64.2` and `r_x = 0.35` we can then compute the real `r_z`
 * (which is only possible, numerically, because we picked rational `r_x`
 * and `r_y`):
 *
 *         r_z = 63.85
 *
 * We can now write out the intervals associated with `z0` (the 
 * naively normalized result), `z1`, `z2` and `z3` (the
 * progessively more conservative results):
 *
 *         63.5 = z0 <?= r_z <?= z0 + 2^-4 = z0 + 1/16 = 63.5625
 *         63.5 = z1 <?= r_z <?= z1 + 2^-1 = z1 + 1/8 = 63.625
 *         63.5 = z2 <?= r_z <?= z2 + 2^-1 = z2 + 1/4 = 63.75
 *         63.5 = z3 <?= r_z <?= z3 + 2^-1 = z3 + 1/2 = 64
 *
 * We see that only `z3` becomes conservative. If we had picked the maximal
 * result value `r_z' = 64.25 - 0.34375 = 63.90625` we see that `z3` is
 * still conservative, which means that not converting leading zeroes into
 * trailing zeroes and dropping 2 additional significant bits on the final
 * answer is sufficient, in this case.
 * 
 * We can now try to prove this for the general case: will dropping two 
 * additional bits on the final answer be sufficiently conservative for all
 * arguments?
 *
 * Note that this would be a very useful result. 
 *
 * At first glance, it may seem wasteful to
 * drop the worst case estimate number of significant bits 
 * for each arithmetic operation that we evaluate.
 *
 * However, since we are working with arbitrary precision floats we can 
 * always make up for that loss of precision in the result by adding 
 * more precision in the arguments.
 * 
 * In practice, we will build a directed acyclic graph where the source
 * nodes are seeded with constants and the internal nodes represent 
 * arithmetic operations.
 *
 * Getting to a certain pre-defined precision at a sink node then involves
 * backpropagating that precision requirement to all argument nodes, and 
 * transitively, to the entire dag below that, bottoming out in the source 
 * nodes that are seeded with constants.
 *
 * Those constants, in turn, can then be trivially approximated to an 
 * arbirary number of digits.
 *
 * In that context, it is much more important to have worst case estimates
 * than average estimates or optimistic case estimates for the precision 
 * loss at each layer of the dag. 
 *
 * Because, absent these worst case estimates, we would not know how to
 * backpropagate precision requirements that are guaranteed to work and the 
 * approximation procedure could easily end up thrashing.
 *
 * Thrashing, in this case, would mean adding input precision and 
 * reevaluating nodes only to find out later that the input precision 
 * is still not sufficient to get the desired output precision, 
 * necessitating round, and-so-on-and-so-forth.
 *
 * To avoid said form of thrashing we need to backpropagate worst-
 * case required precision estimates so that we always get a sufficiently
 * precise result in one iteration.
 *
 * [START INCOMPLETE PROOF:]
 * We can prove this with some interval arithmetic. In particular let `X`
 * and `Y` be arbitrary floating point numbers such that `X > 0` and `Y > 0` 
 * and `X <= Y`
 *
 * Let `Z`be the result of subtracting `X` from `Y` 
 * [END INCOMPLETE PROOF]
 *
 * [TODO: formalize conservative under/over-approximating arithmetic 
 * operations and prove worst case sufficient and necessary bounds 
 * on the number of bits that need to be dropped to keep the resulting 
 * intervals under/over approximating and tight]
 *
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