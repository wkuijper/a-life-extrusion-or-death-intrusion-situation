//# allFunctionsCalledOnLoad

import { 
       strV3, addV3, dotV3, scaleV3, crossV3, negV3, normSqV3,
       normSqV4, addV4, scaleV4,
} from "./linalg.js";

export function quaternionToString([i, j, k, r]) {
       return `[${i}, ${j}, ${k}, ${r}]`;
}

export function addQuaternions(a, b) {
       return addV4(a, b);
}

export function multiplyQuaternions([ai, aj, ak, ar], [bi, bj, bk, br]) {
       const aV = [ai, aj, ak];
       const bV = [bi, bj, bk];
       return [...addV3(
                      addV3(scaleV3(ar, bV), 
                            scaleV3(br, aV)), 
                      crossV3(aV, bV)),
              ar * br - dotV3(aV, bV)]; 
}

export function reciprocateQuaternion(q) {
       const divisor = normSqV4(q);
       if (divisor === 0) {
              return null;
       }
       const reciprocal = 1 / divisor;
       const conjQ = conjugateQuaternion(q);
       return scaleV4(reciprocal, conjQ);
}

export function conjugateQuaternion([i, j, k, r]) {
       return [-i, -j, -k, r];
}

export function normalizeQuaternion(q) {
       return normalizeV4(q);
}

export function identityQuaternion() {
       return [0, 0, 0, 1];
}
   
export function halfQuaternion(q) {
       return normalizeQuaternion(addQuaternions(q, identityQuaternion()));
}

export function slowQuaternionSlerp(q, bits, divident) {
       const divisor = 1 << bits;
       if (divident >= divisor) {
              return q;
       }
       let qq = identityQuaternion();
       if (divident <= 0) {
              return qq;
       }
       bit = divisor >> 1;
       while (bit > 0) {
              qh = halfQuaternion(q);
              if (normSqV4(diffV4(qh, q)) < 1e-25) {
                     break;
              }
              q = qh;
              if ((divident & bit) !== 0) {
                     qq = multiplyQuaternions(q, qq);
                     qq = normalizeQuaternion(qq);
              }
              bit = bit >> 1;
       }
       return qq;
}

/**
 * Fast, numerically stable, incremental spherical interpolation for
 * quaternions that does not rely on trigonometric functions.
 *
 * Interpolants can be computed between a set rotation-quaternion
 * and the identity-quaternion, i.e.: from no-rotation to full-rotation
 * or vice-versa.
 *
 * By doing this for the difference between two arbitrary rotation-
 * quaternions (and subsequently composing the result) we can achieve 
 * interpolation between arbitrary rotation quaternions.
 *
 * Works best for monotonically increasing/decreasing sequences of 
 * interpolation ratios because these allow for the most incremental 
 * computation. But the class can be used for arbitrary interpolation 
 * as well. 
 * 
 * In the worst case it uses a number of quaternion multiplications 
 * equal to half the number of bits, that is: logarithmic in the desired 
 * resolution.
 *
 * The latter also bounds the cumulative error. In general, the interpolants
 * are tied, as much as possible, to the pre-computed, normalized fractions
 * of the original quaternion.
 * 
 * Normalization of the intermediate results does not happen by default and 
 * must be explicitly requested through the constructor to get the most 
 * accurate results. 
 *
 * Note that the end-result of each interpolation is always normalized by 
 * default, even when intermediate normalization is off, for most cases that 
 * should be adequate.
 *
 * If the requested resolution is too big (fractions end up too
 * close together) the number of requested bits is automatically cut off.
 * Note that this happens very easily in degenerate cases like an empty
 * rotation or in edge-cases where the rotation is close to empty.
 */
class FastQuaternionSlerper {

       constructor(maxBits, normalizeIntermediate) {
              if (normalizeIntermediate === undefined) {
                     normalizeIntermediate = false;
              }
              this.__maxBits = maxBits;
              this.__normalizeIntermediate = normalizeIntermediate;
              
              this.__quaternionPosFractions = new Array(maxBits+1);
              this.__quaternionNegFractions = new Array(maxBits+1);
              
              const identityQuaternion = identityQuaternion();
              
              this.__quaternionPosFractions[0] = identityQuaternion;
              this.__quaternionNegFractions[0] = identityQuaternion;
              
              this.__fullQuaternion = identityQuaternion;
              this.__bits = 0;
              this.__divisor = 1;
              
              this.__cachedQuaternion = identityQuaternion;
              this.__cachedDivident = 0;
              this.__cachedDirection = 0;
       }

       set(rotationQuaternion) {
              const fullQuaternion = copyQuaternion(rotationQuaternion);
              const maxBits = this.__maxBits;
              const divisor = 1 << maxBits;
              let q = fullQuaternion;
              let unsafeBits = 0;
              quaternionPosFractions[maxBits] = q;
              quaternionNegFractions[maxBits] = conjugateQuaternion(q)
              for (i = maxBits-1; i >= 0; i--) {
                     qh = halfQuaternion(q); // <-- inherently normalized
                     if (normSqV4(diffV4(qh, q)) < 1e-25) {
                            unsafeBits = i;
                            break;
                     }
                     q = qh;
                     quaternionPosFractions[i] = q;
                     quaternionNegFractions[i] = conjugateQuaternion(q);
              }
              const safeBits = maxBits - unsafeBits;
              if (unsafeBits > 0) {
                     for (let i = 0; i < safeBits; i++) {
                           quaternionPosFractions[i] =
                                  quaternionPosFractions[i + unsafeBits];
                           quaternionNegFractions[i] = 
                                  quaternionNegFractions[i + unsafeBits];     
                     }
              }
              this.__bits = safeBits;
              this.__divisor = 1 << safeBits;
              this.__fullQuaternion = fullQuaternion;
              
              this.__cachedQuaternion = identityQuaternion();
              this.__cachedDivident = 0;
              this.__cachedDirection = 0;
       }
       
       slerp(progressRatio) {
              const divisor = this.__divisor;
              const divident = Math.round(progressRatio * divisor);
              return this.__slerpDivident(divident);
       }

       __slerpDivident(divident) {
              const cachedDirection = this.__cachedDirection;
              const cachedDivident = this.__cachedDivident;
              if (divident === cachedDivident) {
                    return copyQuaternion(this.__cachedQuaternion); 
              } 
              if (cachedDirection === 0) {
                     this.__cachedDirection = 
                            (divident > cachedDivident) ? +1 : -1;
                     return this.__incrementalSlerp(divident);
              } else if (cachedDirection < 0 && progressRatio < cachedProgressRatio) {
                     return this.__incrementalSlerp(divident);
              } else if (cachedDirection > 0 && progressRatio > cachedProgressRatio) {
                     return this.__incrementalSlerp(divident);
              } else {
                     return this.__slerp(divident);
              }
       }

       __incrementalSlerp(targetDivident) {
              const cachedDivident = this.__cachedDivident;
              const divisor = this.__divisor;
              let bit = divisor;
              if ((bit & targetDivident) !== 0) {
                     this.__cachedQuaternion = this.__fullQuaternion;
                     this.__cachedDivident = this.__divisor;
                     this.__cachedDirection = -1;
                     return copyQuaternion(this.__fullQuaternion);
              }
              bit = bit >> 1;
              let incrementalMultiplicationCount = 0;
              let fromAboveMultiplicationCount = 1; // 1 extra for lowest bit
              let fromBelowMultiplicationCount = 0;
              let highestBitIndex = -1;
              let lowestBitIndex = this.__bits;
              for (i = this.__bits-1; i >= 0; i--) {
                     if ((bit & targetDivident) !== 0) {
                            if ((bit & cachedDivident) === 0) {
                                   incrementalMultiplicationCount++;
                            }
                            if (highestBitIndex === -1) {
                                   highestBitIndex = i;
                            } else {
                                   fromBelowMultiplicationCount++;
                            }
                            lowestBitIndex = i;
                     } else {
                            if ((bit & cachedDivident) !== 0) {
                                   incrementalMultiplicationCount++;
                            }
                            if (highestBitIndex >= 0) {
                                   fromAboveMultiplicationCount++;
                            }
                     }
                     bit = bit >> 1;
              }
              if (highestSetTargetBitIndex < 0) {
                     this.__cachedQuaternion = identityQuaternion();
                     this.__cachedDivident = 0;
                     this.__cachedDirection = +1;
                     return identityQuaternion(); 
              }
              if (fromBelowMultiplicationCount <= incrementalMultiplicationCount
                        && fromBelowMultiplicationCount <= fromAboveMultiplicationCount) {
                     return this.__slerpFromBelow(divident, highestBitIndex, lowestBitIndex);
              } 
              if (fromAboveMultiplicationCount <= incrementalMultiplicationCount) {
                     return this.__slerpFromAbove(divident, highestBitIndex, lowestBitIndex);
              }
              const normalizeIntermediate = this.__normalizeIntermediate;
              const posFractions = this.__quaternionPosFractions;
              const negFractions = this.__quaternionNegFractions;
              bit = 1 << lowestBitIndex;
              let q = this.__cachedQuaternion;
              for (let i = lowestBitIndex; i++; i <= highestBitIndex) {
                     if ((bit & targetDivident) !== 0) {
                            if ((bit & cachedDivident) === 0) {
                                   q = multiplyQuaternions(q, posFractions[i]);
                                   if (normalizeIntermediate) {
                                          q = normalizeQuaternion(q);
                                   }
                            }
                     } else {
                            if ((bit & cachedDivident) !== 0) {
                                   q = multiplyQuaternions(q, negFractions[i]);
                                   if (normalizeIntermediate) {
                                          q = normalizeQuaternion(q);
                                   }
                            }
                     }
              }
              q = normalizeQuaternion(q);
              this.__cachedQuaternion = q;
              this.__cachedDivident = divident;
              this.__cachedDirection = 0;
              return copyQuaternion(q);
       }

       __slerp(targetDivident, normalizeIntermediate) {
              const divisor = this.__divisor;
              let bit = divisor;
              if ((bit & targetDivident) !== 0) {
                     this.__cachedQuaternion = this.__fullQuaternion;
                     this.__cachedDivident = this.__divisor;
                     this.__cachedDirection = -1;
                     return copyQuaternion(this.__fullQuaternion);
              }
              bit = bit >> 1;
              let fromAboveMultiplicationCount = 1; // 1 extra for lowest bit
              let fromBelowMultiplicationCount = 0;
              let highestBitIndex = -1;
              let lowestBitIndex = this.__bits;
              for (i = this.__bits-1; i >= 0; i--) {
                     if ((bit & targetDivident) !== 0) {
                            if (highestBitIndex === -1) {
                                   highestBitIndex = i;
                            } else {
                                   fromBelowMultiplicationCount++;
                            }
                            lowestBitIndex = i;
                     } else {
                            if (highestBitIndex >= 0) {
                                   fromAboveMultiplicationCount++;
                            }
                     }
                     bit = bit >> 1;
              }
              if (highestSetTargetBitIndex < 0) {
                     this.__cachedQuaternion = identityQuaternion();
                     this.__cachedDivident = 0;
                     this.__cachedDirection = +1;
                     return identityQuaternion(); 
              }
              if (fromBelowMultiplicationCount <= fromAboveMultiplicationCount) {
                     return this.__slerpFromBelow(divident, highestBitIndex, lowestBitIndex, normalizeIntermediate);
              }  else {
                     return this.__slerpFromAbove(divident, highestBitIndex, lowestBitIndex, normalizeIntermediate); 
              }
       }
       
       __slerpFromBelow(divident, highestBitIndex, lowestBitIndex) {
              const normalizeIntermediate = this.__normalizeIntermediate;
              const posFractions = this.__quaternionPosFractions;
              let q = posFractions[lowestBitIndex];
              let bit = 1 << lowestBitIndex;
              for (i = lowestBitIndex+1; i <= highestBitIndex; i++) {
                     bit = bit << 1;
                     if ((divident & bit) !== 0) {
                            q = multiplyQuaternions(q, posFractions[i]);
                            if (normalizeIntermediate) {
                                   q = normalizeQuaternion(q);
                            }
                     }
              }
              q = normalizeQuaternion(q);
              this.__cachedQuaternion = q;
              this.__cachedDivident = divident;
              this.__cachedDirection = 0;
              return copyQuaternion(q);
       }
       
       __slerpFromAbove(divident, highestBitIndex, lowestBitIndex) {
              const normalizeIntermediate = this.__normalizeIntermediate;
              const posFractions = this.__quaternionPosFractions;
              let q = posFractions[highestBitIndex+1];
              const negFractions = this.__quaternionNegFractions;
              let bit = 1 << highestBitIndex;
              for (i = highestBitIndex-1; i >= 0; i--) {
                     bit = bit >> 1;
                     if ((divident & bit) === 0) {
                            q = multiplyQuaternions(q, negFractions[i]);
                            if (normalizeIntermediate) {
                                   q = normalizeQuaternion(q);
                            }
                     }
              }
              // subtracting the lowest bit from a power-of-two
              // gets us to a string of all 1-bits
              // which is what we would have started from 
              // since we're subtracting
              // all the powers of the zero-bits.
              // conceptually it would be clearer if we'd do this first
              // but numerically it's better to do it last:
              q = multiplyQuaternions(q, negFractions[0]);
              q = normalizeQuaternion(q);
              this.__cachedQuaternion = q;
              this.__cachedDivident = divident;
              this.__cachedDirection = 0;
              return copyQuaternion(q);
       }
}

export function pureQuaternionForVector([i, j, k]) {
       return [i, j, k, 0];
}

export function rotationQuaternionForAxisAngle(axis, angle) {
       const halfAngle = angle / 2;
       const sinHalfAngle = Math.sin(halfAngle);
       const cosHalfAngle = Math.cos(halfAngle);
       const axisScaledBySinHalfAngle = scaleV3(sinHalfAngle, axis);
       return [...axisScaledBySinHalfAngle, cosHalfAngle];
}

export function axisAngleForRotationQuaternion([i, j, k, r]) {
       return [normalizeV3([i, j, k]), 2 * Math.acos(r)];
}
       
export function rotationMatrixForQuaternion([i, j, k, r]) {
       const ii = i * i; const jj = j * j; const kk = k * k;
       const ij = i * j; const ir = i * r; const ik = i * k;
       const jr = j * r; const jk = j * k; const kr = k * r;
       const m = [
              1 - 2*(jj + kk), 2*(ij - kr), 2*(ik + jr),
              2 * (ij + kr), 1 - 2 * (ii + kk), 2 * (jk - ir),
              2 * (ik - jr), 2 * (jk + ir), 1 - 2 * (ii + jj), 
       ];
       const [a1, b1, c1, a2, b2, c2, a3, b3, c3] = m;
       return m;
}

export function rotateVectorByQuaternion([x, y, z], [i, j, k, r]) {
       const ii = i * i; const jj = j * j; const kk = k * k;
       const ij = i * j; const ir = i * r; const ik = i * k;
       const jr = j * r; const jk = j * k; const kr = k * r;
       return [
              (1 - 2*(jj + kk)) * x + (2*(ij - kr)) * y + (2*(ik + jr)) * z,
              (2 * (ij + kr)) * x + (1 - 2 * (ii + kk)) * y + (2 * (jk - ir)) * z,
              (2 * (ik - jr)) * x + (2 * (jk + ir)) * y + (1 - 2 * (ii + jj)) * z,
       ];
}

function __outline_quaternionForRotationMatrix([a1, b1, c1, a2, b2, c2, a3, b3, c3]) {
       /* Adapted from: 
        *   http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm
        *
        * From the conversion of a rotation quaternion into a matrix (see above) we have:
        *
        *              a1 = 1 - 2 * (y^2 + z^2)   (A1)
        *              b1 = 2 * (xy - zw)         (A2)
        *              c1 = 2 * (xz + yw)         (A3)
        *              a2 = 2 * (xy + zw),        (A4)
        *              b2 = 1 - 2 * (x^2 + z^2)   (A5)
        *              c2 = 2 * (yz - xw)         (A6)
        *              a3 = 2 * (xz - yw)         (A7)
        *              b3 = 2 * (yz + xw)         (A8)
        *              c3 = 1 - 2 * (x^2 + y^2)   (A9)
        *
        * And for a normalized quaternion it should hold:
        *
        *              x^2 + y^2 + z^2 + w^2 = 1  (B1)
        *
        * These equations are much more than we need: essentially the matrix is a richer
        * representation than the rotation quaternion. Matrices can also represent scaling, 
        * mirroring and projection. We may wish to detect those cases where the matrix
        * does not represent a pure rotation (i.e.: the matrix is not special orthonormal)
        * and we may wish to use the redundancy to come up with a more robust approach, but
        * in general it's good to notice this redundancy from the outset.
        *
        * As an example and as a consequence of said redundancy, note that it is possible to
        * solve at least the magnitude of all of the coefficients x, y, z, and w from only
        * the diagonal entries of the matrix. 
        * 
        * In particular, if the diagonal of the matrix consists of only zeros it follows we 
        * can infer the possible non-diagonal parts of the matrix.
        *
        * This may seem strange, at first, but a good spatial intuition here can be gained
        * by thinking about what such a rotation matrix represents. In particular, a 
        * rotationmatrix with all diagonal entries set to zero (implying trace equal to zero) 
        * defines a a rotation that must confine every axis into the plane perpendicular to 
        * it (because the column-vectors making up the rotation matrix have their own 
        * corresponding entries zeroed out).
        *
        * In general there is only a small finite number of such rotations depending on how we 
        * choose the signs, that is: depending on which of the half-planes of the world 
        * coordinate system we rotate the respective a/b/c-axis into. 
        *
        * For all other rotations that don't strictly send the axis to their orthogonal planes 
        * the diagonal will hold more information in the form of non-zero entries.
        *
        * Below we proceed to solve the first coefficient from the diagonal. Subsequently we
        * will use this first coefficient (which can be any of x, y, z or w) to bootstrap the
        * process of finding the other coefficients in the most robust possible manner.
        *
        * We will see that for bootstrapping on w we will need (B1) whilst we don't need that
        * for bootstrapping from any of the other coefficients. For that reason we will
        * start with the real coefficient w before moving on to the imaginary coefficients
        * x, y and z.
        *
        * Working, then, towards solving w from the diagonal we start with (B1) from which 
        * we get:
        *
        *              w^2 = 1 - x^2 - y^2 - z^2
        *
        * We multiply both sides by 4, working towards splitting these terms and re-arranging 
        * them to recover the diagonal matrix entries a1, b2, and c3:
        *
        *             4w^2 = 4 - 4x^2 - 4y^2 - 4z^2
        *             4w^2 = 4 - (2x^2 + 2x^2) - (2y^2 + 2y^2) - (2z^2 + 2z^2)
        *             4w^2 = (1 + 1 + 1 + 1) - 2x^2 - 2x^2 - 2^y2 - 2^y2 - 2z^2 - 2z^2
        *
        * Re-arranging the terms we indeed obtain:
        *
        *             4w^2 = 1 + (1 - 2y^2 - 2z^2) + (1 - 2x^2 - 2z^2) + (1 - 2x^2 - 2y^2)
        *                        \_______________/   \_______________/   \_______________/
        *                                |                   |                   |
        *                                a1                  b2                  c3
        *
        * That is one plus the trace of the matrix:
        *
        *             4w^2 = 1 + a1 + b2 + c3 
        *
        * Solving for w we obtain:
        *
        *              w^2 = (1/4) * (1 + a1 + b2 + c3)
        *                w = +/- sqrt((1/4) * (1 + a1 + b2 + c3))
        *                w = +/- sqrt(1/4) * sqrt(1 + a1 + b2 + c3)
        *                w = +/- (1/2) * sqrt(1 + a1 + b2 + c3)
        *
        * We could also solve at least the magnitude of the imaginary coefficients x, y and z 
        * from the diagonal. However that would be underdetermined because of the signs of
        * the resulting roots.
        *
        * For that reason we only determine one of the coefficients this way, bootstrapping
        * the process of finding the others. Then there is only one root and only one sign
        * we need to pick to get a solution (this corresponds to the fact that there are 
        * exactly two quaternions for each rotation; the, so called, double-cover).
        *
        * Continuing, we see we need a way to bootstrap also from x, y or z if that would be 
        * numerically more robust than bootstrapping from w. 
        *
        * For bootstrapping from any of the imaginary coefficients x, y, z we don't need w at 
        * all and therefore don't need (B1). 
        *
        * Instead we just start from (A1), (A2) and (A9) and proceed by subtracting/adding 
        * terms strategically to arrive at either of the three coefficients.
        *
        * For example, to get x we can subtract b2 and c3 from a1 so that the y and z parts 
        * cancel out:
        *
        *             4x^2 = 1 + (1 - 2y^2 - 2z^2) - (1 - 2x^2 - 2z^2) - (1 - 2x^2 - 2y^2)
        *                        \_______________/ ^ \_______________/ ^ \_______________/
        *                                |         |         |         |         |
        *                                a1        |         b2        |         c3
        *                                       flipped!            flipped!
        *
        * Continuing this way, this gives us a total of four starting points depending on 
        * which co-efficient we solve for first:
        *    
        *                 x = +/- (1/2) * sqrt(1 + a1 - b2 - c3)   (C1)
        *                 y = +/- (1/2) * sqrt(1 - a1 + b2 - c3)   (C2)
        *                 z = +/- (1/2) * sqrt(1 - a1 - b2 + c3)   (C3)
        *                 w = +/- (1/2) * sqrt(1 + a1 + b2 + c3)   (C4)
        *
        * Geometrically, solving for w first corresponds to focusing on the angle first
        * (because w corresponds to the cosine of the halfangle) and solving for either
        * x, y or z corresponds to focusing on the axis first (because the direction of
        * the vector [x, y, z] corresponds to the axis over which the rotation takes
        * place).
        *
        * For robustness it's good to solve the most significant part first: if a 
        * rotation has a very small angle it's good to solve the axis first, if a rotation
        * axis has a very small component then it's good so solve for another component
        * of the axis first.
        *
        * Algorithmically this corresponds to choosing the largest of the sums:
        *
        *                sx = 1 + a1 - b2 - c3
        *                sy = 1 - a1 + b2 - c3
        *                sz = 1 - a1 - b2 + c3
        *                sw = 1 + a1 + b2 + c3
        *
        * Allowing us to evaluate the square root as far removed as possible from the 
        * vertical tangent of the square root function (where it is most sensitive to 
        * variations of its input value.)
        *
        * The resulting coefficient x, y, z or w will then bootstrap the process of 
        * getting to the other coeffients.
        *
        * To see how to do the latter, note that by strategically adding/subtracting the 
        * other entries in the matrix we can express every coefficient in terms of every 
        * other coefficient.
        *
        * For example, using (A6) and (A8) we get:
        *
        *                (b3 - c2) = 2(yz + xw) - 2(yz - xw)
        *                          = 2yz + 2xw - 2yz + 2xw
        *                          = 4xw
        *
        * Solving for x gives:
        *
        *                        x = (b3 - c2) / 4w
        *
        * This can be done for all combinations, yielding the following table:
        *
        *      x = ...(C1)...  x = (a2+b1)/4y  x = (c1+a3)/4z  x = (b3-c2)/4w                     
        *      y = (a2+b1)/4x  y = ...(C2)...  y = (b3+c2)/4z  y = (c1-a3)/4w     
        *      z = (c1+a3)/4x  z = (b3+c2)/4y  z = ...(C3)...  z = (a2-b1)/4w  
        *      w = (b3-c2)/4x  w = (c1-a3)/4y  w = (a2-b1)/4z  w = ...(C4)...   
        *
        * For robustness it's good to pick the next step in the solution to
        * minimize the distance between the exponents of the two matrix entries 
        * that are being subtracted: floating point subtraction requires aligning 
        * the mantissas and this leads to truncation for exponents that differ by 
        * too many positions.
        *
        * This means that we're picking a relationship u = (m1 - m2)/v, for some 
        * pair of coefficients u and v and some pair of matrix elements m1 and m2, 
        * such that the ratio m1/m2 is closest to one or minus one.
        *
        * Geometrically, I guess this corresponds to choosing the spatial relation
        * (axiscomp-angle, angle-axiscomp or axiscomp-axiscomp) between those 
        * quantities that are most linearly related when perturbing them.
        *
        * Note, by the way, that differing exponents was not yet such an issue for 
        * choosing the sum in the first step since each of the expressions (C1) 
        * upto (C4) requires the same additions/subtractions differing only by signs.
        *
        * By looking at the relative difference in exponents we can choose the
        * next step in the table, doing this recursively creates a decision tree 
        * that will be our final algorithm.
        *
        * Because the decision tree becomes quite big, the code below is only an 
        * outline:
        */
       throw new Error("don't actually use this incomplete outline function");

       /*
        * The full function is generated by the function following the present.
        */

       // pre-calculate approximate exponents
       
       const b3ae = Math.log2(b3);
       const c2ae = Math.log2(c2);
       const c1ae = Math.log2(c1);
       const a3ae = Math.log2(a3);
       const a2ae = Math.log2(a3);
       const b1ae = Math.log2(b1);

       // determine the sums
       
       const sx = 1 + a1 - b2 - c3;
       const sy = 1 - a1 + b2 - c3;
       const sz = 1 - a1 - b2 + c3;
       const sw = 1 + a1 + b2 + c3;

       // choose which sum is greatest and bootstrap accordingly
       
       if (sw >= sx && sw >= sy && sw >= sz) {
              // we're bootstraping from w
              if (sw < 0) { // <-- is this tight? 
                            // (I don't think so)
                     throw new Error(`not a pure rotation matrix`);
              }
              // can it still be that matrix is not special orthonormal? 
              // (I think so, but we'll roll with it)
              const w = .5 * Math.sqrt(sw);

              // options for next step:
              // x = (b3-c2)/4w
              // y = (c1-a3)/4w 
              // z = (a2-b1)/4w

              // calculate differences
              const xwD = Math.abs(b3ae - c2ae);
              const ywD = Math.abs(c1ae - a3ae);
              const zwD = Math.abs(a2ae - b1ae);

              // decide
              const recip4w = 1/(4*w);
              if (xwD <= ywD && xwD <= zwd) {
                     const x = (b3-c2) * recip4w;

                     if (x === 0) {

                            // existing options for next step:
                            // y = (c1-a3)/4w 
                            // z = (a2-b1)/4w
                            
                            // decide
                            if (ywD <= zwD) {
                                   const y = (c1-a3) * recip4w;

                                   if (y === 0) {

                                          // ...
                                   
                                   } else {

                                          // ...
                                          
                                   }
                                   
                            } else {

                                   // ...
                            }
                            
                     } else {
                     
                            // existing options for next step:
                            // y = (c1-a3)/4w 
                            // z = (a2-b1)/4w
       
                            // new options for next step:
                            // y = (a2+b1)/4x
                            // z = (c1+a3)/4x
       
                            // calculate differences for new options
                            const yxD = Math.abs(a2ae - b1ae);
                            const zxD = Math.abs(c1ae - a3ae);
       
                            // decide
                            if (ywD <= zwD && ywD <= yxD && ywD <= zxD) {
                                   const y = (c1-a3) * recip4w;  
       
                                   // ...
                                   
                            } else if (zwD <= yxD && zwD <= zxD) {
                                   const z = (a2-b1) * recip4w;
       
                                   // ...
                                   
                            } else {
                                   const recip4x = 1/(4*x);
                                   if (yxD <= zxD) {
                                          const y = (a2+b1) * recip4x;
                                          
                                          if (y === 0) {

                                                 // existing options for next step
                                                 // z = (a2-b1)/4w
                                                 // z = (c1+a3)/4x
                                                 
                                                 // ...
                                                 
                                          } else {
       
                                                 // existing options for next step
                                                 // z = (a2-b1)/4w
                                                 // z = (c1+a3)/4x
              
                                                 // new option for next step
                                                 // z = (b3+c2)/4y
                                                 
                                                 // calculate differences for new option
                                                 const zyD = Math.abs(b3ae - c2ae);
              
                                                 // decide
                                                 if (zwD <= zxD && zwD <= zyD && zwD <= zyD) {
                                                        const z = (a2-b1) * recip4w;
                                                        return [x, y, z, w];
                                                 } else if (zxD <= zyD) {
                                                        const z = (c1+a3) * recip4x;
                                                        return [x, y, z, w];
                                                 } else {
                                                        const z = (b3+c2)/(4 * y);
                                                        return [x, y, z, w];
                                                 }

                                          }
                                          
                                   } else {
                                          const z = (c1+a3) * recip4x;
       
                                          // ...
                                   }
                            }
                     }
              } else if (ywD <= zwD) {
                     const y = (c1-a3) * recip4w;

                     // ...
                     
              } else {
                     const z = (a2-b1) * recip4w;
                     
                     // ...
              }
       } else if (sz >= sy && sz >= sx) {
              // we're bootstraping from z
              if (sz < 0) {
                     throw new Error(`not a pure rotation matrix`);
              }
              const z = .5 * Math.sqrt(sz);
              
              // options for next step:
              // x = (c1+a3)/4z
              // y = (b3+c2)/4z
              // w = (a2+b1)/4z

              // ...
              
       } else if (sy >= sx) {
              // we're bootstraping from y
              if (sy < 0) {
                     throw new Error(`not a pure rotation matrix`);
              }
              const y = .5 * Math.sqrt(sy);

              // options for next step:
              // x = (a2+b1)/4y
              // z = (b3+c2)/4y
              // w = (c1+a3)/4y

              // ...
              
       } else {
              // we're bootstraping from x
              
              if (sx < 0) {
                     throw new Error(`not a pure rotation matrix`);
              }
              const x = .5 * Math.sqrt(sx);

              // options for next step:
              // y = (a2+b1)/4x
              // z = (c1+a3)/4x
              // w = (b3+c2)/4x

              // ...
       }
}

export function _gen__quaternionForRotationMatrix(outputLine, indent, tab) {

       const indent2 = indent + tab;
       
       const line__ = (str) => { outputLine( indent + str ) };
       const line____ = (str) => { outputLine( indent2 + str ) };
       
       line__(`export function quaternionForRotationMatrix([a1, b1, c1, a2, b2, c2, a3, b3, c3]) {`);
       line____(``);
       line____(`const a2ae = Math.log2(a2);`);
       line____(`const a3ae = Math.log2(a3);`);
       line____(`const b1ae = Math.log2(b1);`);
       line____(`const b3ae = Math.log2(b3);`);
       line____(`const c1ae = Math.log2(c1);`);
       line____(`const c2ae = Math.log2(c2);`);
       line____(``);
       line____(`const sx = 1 + a1 - b2 - c3;`);
       line____(`const sy = 1 - a1 + b2 - c3;`);
       line____(`const sz = 1 - a1 - b2 + c3;`);
       line____(`const sw = 1 + a1 + b2 + c3;`);
       line____(``);

       const remainingTestCoefs = ["w", "z", "y", "x"];
       
       let firstIfCondition = true;
       while (remainingTestCoefs.length > 0) {
              const bootstrapCoef = remainingTestCoefs.pop();
              let codeIfElseCond = "";
              if (firstIfCondition) {
                     firstIfCondition = false;
              } else {
                     codeIfElseCond += "} else "
              }
              if (remainingTestCoefs.length > 0) {
                     codeIfElseCond += "if (";
                     let firstTest = true;
                     for (const testCoef of remainingTestCoefs) {
                            if (firstTest) {
                                   firstTest = false;
                            } else {
                                   codeIfElseCond += " && ";
                            }
                            codeIfElseCond += `s${bootstrapCoef} >= s${testCoef}`;
                     }
                     codeIfElseCond += ") "
              }
              line____(codeIfElseCond + "{");
              __gen__qFRM_lvl2(outputLine, indent2 + tab, tab,
                               bootstrapCoef);
       }
       line____("}")
       line__("}");
}

function __gen__qFRM_lvl2(outputLine, indent, tab, bootstrapCoef) {
       const remainingCoefs = __filter(["x", "y", "z", "w"], 
                                       (coef) => coef !== bootstrapCoef);
       
       const indent2 = indent + tab;
       
       const line__ = (str) => { outputLine( indent + str ) };
       const line____ = (str) => { outputLine( indent2 + str ) };

       line__(`if (s${bootstrapCoef} < 0) {`);
       line____(`throw new Error("not a pure rotation matrix");`);
       line__(`}`);
       line__(`const ${bootstrapCoef} = .5 * Math.sqrt(s${bootstrapCoef});`);

       const needToKnowCoef = new Set(remainingCoefs);
       const knowCoef = new Set([bootstrapCoef]);
       const knowNonZeroCoef = new Set([bootstrapCoef]);

       const relevantAlternatives = [];
       const enabledAlternatives = [];
       for (const alternative of __qFRM_table) {
              const [tgtCoef, leftComp, op, rightComp, srcCoef] = alternative;
              if (needToKnowCoef.has(tgtCoef)) {
                     relevantAlternatives.push(alternative);
                     if (knowNonZeroCoef.has(srcCoef)) {
                            enabledAlternatives.push(alternative);
                     }
              }
       }

       const remainingTestDs = [];
       const computedDs = new Set();
       
       for (const [tgtCoef, leftComp, op, rightComp, srcCoef] of enabledAlternatives) {
              const dif = `${tgtCoef}${srcCoef}D`;
              line__(`const ${dif} = Math.abs(${leftComp}ae - ${rightComp}ae);`);  
              remainingTestDs.push(dif);
              computedDs.add(dif);
       }

       let firstIfCondition = true;
       while (remainingTestDs.length > 0) {
              const candidateD = remainingTestDs.pop();
              let codeIfElseCond = "";
              if (firstIfCondition) {
                     firstIfCondition = false;
              } else {
                     codeIfElseCond += "} else "
              }
              if (remainingTestDs.length > 0) {
                     codeIfElseCond += "if (";
                     let firstTest = true;
                     for (const testD of remainingTestDs) {
                            if (firstTest) {
                                   firstTest = false;
                            } else {
                                   codeIfElseCond += " && ";
                            }
                            codeIfElseCond += `${candidateD} <= ${testD}`;
                     }
                     codeIfElseCond += ") "
              }
              line__(codeIfElseCond + "{");
              const coef1 = candidateD[0];
              const coef2 = candidateD[1];
              const nextRelevantAlternatives = [];
              for (const [tgtCoef, leftComp, op, rightComp, srcCoef] of relevantAlternatives) {
                     if (tgtCoef === coef1 && srcCoef === coef2) {
                            line____(`const ${coef1} = (${leftComp} ${op} ${rightComp}) / (4 * ${coef2});`);
                            line____(`if (${coef1} === 0) {`);
                     } else if (tgtCoef !== coef1) {
                            nextRelevantAlternatives.push([tgtCoef, leftComp, op, rightComp, srcCoef]);
                     }
              }
              const nextKnowCoef = new Set([...knowCoef, coef1]);
              __gen__qFRM_lvl3(outputLine, indent2 + tab, tab, nextKnowCoef, knowNonZeroCoef, computedDs, nextRelevantAlternatives);
              line____(`} else {`);
              const nextKnowNonZeroCoef = new Set([...knowCoef, coef1]);
              __gen__qFRM_lvl3(outputLine, indent2 + tab, tab, nextKnowCoef, nextKnowNonZeroCoef, computedDs, nextRelevantAlternatives);
              line____(`}`);
       }
       line__("}")
}

function __gen__qFRM_lvl3(outputLine, indent, tab, knowCoef, knowNonZeroCoef, computedDs, relevantAlternatives) {
       const remainingCoefs = __filter(["x", "y", "z", "w"], 
                                       (coef) => !knowCoef.has(coef));
       
       const indent2 = indent + tab;
       
       const line__ = (str) => { outputLine( indent + str ) };
       const line____ = (str) => { outputLine( indent2 + str ) };

       const needToKnowCoef = new Set(remainingCoefs);
       const enabledAlternatives = [];
       for (const alternative of relevantAlternatives) {
              const [tgtCoef, leftComp, op, rightComp, srcCoef] = alternative;
              if (needToKnowCoef.has(tgtCoef) && knowNonZeroCoef.has(srcCoef)) {
                     enabledAlternatives.push(alternative);
              }
       }

       const remainingTestDs = [];
       const nextComputedDs = new Set([...computedDs]);
       
       for (const [tgtCoef, leftComp, op, rightComp, srcCoef] of enabledAlternatives) {
              const dif = `${tgtCoef}${srcCoef}D`;
              if (!computedDs.has(dif)) {
                     line__(`const ${dif} = Math.abs(${leftComp}ae - ${rightComp}ae);`);  
                     nextComputedDs.add(dif);
              }
              remainingTestDs.push(dif);
       }

       let firstIfCondition = true;
       while (remainingTestDs.length > 0) {
              const candidateD = remainingTestDs.pop();
              let codeIfElseCond = "";
              if (firstIfCondition) {
                     firstIfCondition = false;
              } else {
                     codeIfElseCond += "} else "
              }
              if (remainingTestDs.length > 0) {
                     codeIfElseCond += "if (";
                     let firstTest = true;
                     for (const testD of remainingTestDs) {
                            if (firstTest) {
                                   firstTest = false;
                            } else {
                                   codeIfElseCond += " && ";
                            }
                            codeIfElseCond += `${candidateD} <= ${testD}`;
                     }
                     codeIfElseCond += ") "
              }
              line__(codeIfElseCond + "{");
              const coef1 = candidateD[0];
              const coef2 = candidateD[1];
              const nextRelevantAlternatives = [];
              for (const [tgtCoef, leftComp, op, rightComp, srcCoef] of relevantAlternatives) {
                     if (tgtCoef === coef1 && srcCoef === coef2) {
                            line____(`const ${coef1} = (${leftComp} ${op} ${rightComp}) / (4 * ${coef2});`);
                            line____(`if (${coef1} === 0) {`);
                     } else if (tgtCoef !== coef1) {
                            nextRelevantAlternatives.push([tgtCoef, leftComp, op, rightComp, srcCoef]);
                     }
              }
              const nextKnowCoef = new Set([...knowCoef, coef1]);
              __gen__qFRM_lvl4(outputLine, indent2 + tab, tab, nextKnowCoef, knowNonZeroCoef, computedDs, nextRelevantAlternatives);
              line____(`} else {`);
              const nextKnowNonZeroCoef = new Set([...knowCoef, coef1]);
              __gen__qFRM_lvl4(outputLine, indent2 + tab, tab, nextKnowCoef, nextKnowNonZeroCoef, computedDs, nextRelevantAlternatives);
              line____(`}`);
       }
       line__("}")
}

function __gen__qFRM_lvl4(outputLine, indent, tab, knowCoef, knowNonZeroCoef, computedDs, relevantAlternatives) {
       const remainingCoefs = __filter(["x", "y", "z", "w"], 
                                       (coef) => !knowCoef.has(coef));
       
       const indent2 = indent + tab;
       
       const line__ = (str) => { outputLine( indent + str ) };
       const line____ = (str) => { outputLine( indent2 + str ) };

       const needToKnowCoef = new Set(remainingCoefs);
       const enabledAlternatives = [];
       for (const alternative of relevantAlternatives) {
              const [tgtCoef, leftComp, op, rightComp, srcCoef] = alternative;
              if (needToKnowCoef.has(tgtCoef) && knowNonZeroCoef.has(srcCoef)) {
                     enabledAlternatives.push(alternative);
              }
       }

       const remainingTestDs = [];
       const nextComputedDs = new Set([...computedDs]);
       
       for (const [tgtCoef, leftComp, op, rightComp, srcCoef] of enabledAlternatives) {
              const dif = `${tgtCoef}${srcCoef}D`;
              if (!computedDs.has(dif)) {
                     line__(`const ${dif} = Math.abs(${leftComp}ae - ${rightComp}ae);`);  
                     nextComputedDs.add(dif);
              }
              remainingTestDs.push(dif);
       }

       let firstIfCondition = true;
       while (remainingTestDs.length > 0) {
              const candidateD = remainingTestDs.pop();
              let codeIfElseCond = "";
              if (firstIfCondition) {
                     firstIfCondition = false;
              } else {
                     codeIfElseCond += "} else "
              }
              if (remainingTestDs.length > 0) {
                     codeIfElseCond += "if (";
                     let firstTest = true;
                     for (const testD of remainingTestDs) {
                            if (firstTest) {
                                   firstTest = false;
                            } else {
                                   codeIfElseCond += " && ";
                            }
                            codeIfElseCond += `${candidateD} <= ${testD}`;
                     }
                     codeIfElseCond += ") "
              }
              line__(codeIfElseCond + "{");
              const coef1 = candidateD[0];
              const coef2 = candidateD[1];
              for (const [tgtCoef, leftComp, op, rightComp, srcCoef] of relevantAlternatives) {
                     if (tgtCoef === coef1 && srcCoef === coef2) {
                            line____(`const ${coef1} = (${leftComp} ${op} ${rightComp}) / (4 * ${coef2});`);
                            line____(`return [x, y, z, w];`);
                            break;
                     }
              }
       }
       line__("}")
}

function __filter(list, cond) {
       const filteredList = [];
       for (const item of list) {
              if (cond(item)) {
                     filteredList.push(item);
              }
       }
       return filteredList;
}

/*
 *      x = ...(C1)...  x = (a2+b1)/4y  x = (c1+a3)/4z  x = (b3-c2)/4w                     
 *      y = (a2+b1)/4x  y = ...(C2)...  y = (b3+c2)/4z  y = (c1-a3)/4w     
 *      z = (c1+a3)/4x  z = (b3+c2)/4y  z = ...(C3)...  z = (a2-b1)/4w  
 *      w = (b3-c2)/4x  w = (c1-a3)/4y  w = (a2-b1)/4z  w = ...(C4)... 
 */
const __qFRM_table = [
       ["y", /* == */ "a2", "+", "b1", "x"],
       ["z", /* == */ "c1", "+", "a3", "x"],
       ["w", /* == */ "b3", "-", "c2", "x"],
       
       ["x", /* == */ "a2", "+", "b1", "y"],
       ["z", /* == */ "b3", "+", "c2", "y"],
       ["w", /* == */ "c1", "-", "a3", "y"],
       
       ["x", /* == */ "c1", "+", "a3", "z"],
       ["y", /* == */ "b3", "+", "c2", "z"],
       ["w", /* == */ "a2", "-", "b1", "z"],
       
       ["x", /* == */ "b3", "-", "c2", "w"],
       ["y", /* == */ "c1", "-", "a3", "w"],
       ["z", /* == */ "a2", "-", "b1", "w"],
];

export function quaternionForRotationMatrix([a1, b1, c1, a2, b2, c2, a3, b3, c3]) {
    
    const a2ae = Math.log2(a2);
    const a3ae = Math.log2(a3);
    const b1ae = Math.log2(b1);
    const b3ae = Math.log2(b3);
    const c1ae = Math.log2(c1);
    const c2ae = Math.log2(c2);
    
    const sx = 1 + a1 - b2 - c3;
    const sy = 1 - a1 + b2 - c3;
    const sz = 1 - a1 - b2 + c3;
    const sw = 1 + a1 + b2 + c3;
    
    if (sx >= sw && sx >= sz && sx >= sy) {
        if (sx < 0) {
            throw new Error("not a pure rotation matrix");
        }
        const x = .5 * Math.sqrt(sx);
        const yxD = Math.abs(a2ae - b1ae);
        const zxD = Math.abs(c1ae - a3ae);
        const wxD = Math.abs(b3ae - c2ae);
        if (wxD <= yxD && wxD <= zxD) {
            const w = (b3 - c2) / (4 * x);
            if (w === 0) {
                if (zxD <= yxD) {
                    const z = (c1 + a3) / (4 * x);
                    if (z === 0) {
                        {
                            const y = (a2 + b1) / (4 * x);
                            return [x, y, z, w];
                        }
                    } else {
                        const yzD = Math.abs(b3ae - c2ae);
                        const ywD = Math.abs(c1ae - a3ae);
                        if (ywD <= yxD && ywD <= yzD) {
                            const y = (c1 - a3) / (4 * w);
                            return [x, y, z, w];
                        } else if (yzD <= yxD) {
                            const y = (b3 + c2) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const y = (a2 + b1) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                } else {
                    const y = (a2 + b1) / (4 * x);
                    if (y === 0) {
                        {
                            const z = (c1 + a3) / (4 * x);
                            return [x, y, z, w];
                        }
                    } else {
                        const zyD = Math.abs(b3ae - c2ae);
                        const zwD = Math.abs(a2ae - b1ae);
                        if (zwD <= zxD && zwD <= zyD) {
                            const z = (a2 - b1) / (4 * w);
                            return [x, y, z, w];
                        } else if (zyD <= zxD) {
                            const z = (b3 + c2) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const z = (c1 + a3) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                }
            } else {
                const ywD = Math.abs(c1ae - a3ae);
                const zwD = Math.abs(a2ae - b1ae);
                if (zwD <= yxD && zwD <= zxD && zwD <= ywD) {
                    const z = (a2 - b1) / (4 * w);
                    if (z === 0) {
                        const ywD = Math.abs(c1ae - a3ae);
                        if (ywD <= yxD) {
                            const y = (c1 - a3) / (4 * w);
                            return [x, y, z, w];
                        } else {
                            const y = (a2 + b1) / (4 * x);
                            return [x, y, z, w];
                        }
                    } else {
                        const yzD = Math.abs(b3ae - c2ae);
                        const ywD = Math.abs(c1ae - a3ae);
                        if (ywD <= yxD && ywD <= yzD) {
                            const y = (c1 - a3) / (4 * w);
                            return [x, y, z, w];
                        } else if (yzD <= yxD) {
                            const y = (b3 + c2) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const y = (a2 + b1) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                } else if (ywD <= yxD && ywD <= zxD) {
                    const y = (c1 - a3) / (4 * w);
                    if (y === 0) {
                        const zwD = Math.abs(a2ae - b1ae);
                        if (zwD <= zxD) {
                            const z = (a2 - b1) / (4 * w);
                            return [x, y, z, w];
                        } else {
                            const z = (c1 + a3) / (4 * x);
                            return [x, y, z, w];
                        }
                    } else {
                        const zyD = Math.abs(b3ae - c2ae);
                        const zwD = Math.abs(a2ae - b1ae);
                        if (zwD <= zxD && zwD <= zyD) {
                            const z = (a2 - b1) / (4 * w);
                            return [x, y, z, w];
                        } else if (zyD <= zxD) {
                            const z = (b3 + c2) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const z = (c1 + a3) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                } else if (zxD <= yxD) {
                    const z = (c1 + a3) / (4 * x);
                    if (z === 0) {
                        const ywD = Math.abs(c1ae - a3ae);
                        if (ywD <= yxD) {
                            const y = (c1 - a3) / (4 * w);
                            return [x, y, z, w];
                        } else {
                            const y = (a2 + b1) / (4 * x);
                            return [x, y, z, w];
                        }
                    } else {
                        const yzD = Math.abs(b3ae - c2ae);
                        const ywD = Math.abs(c1ae - a3ae);
                        if (ywD <= yxD && ywD <= yzD) {
                            const y = (c1 - a3) / (4 * w);
                            return [x, y, z, w];
                        } else if (yzD <= yxD) {
                            const y = (b3 + c2) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const y = (a2 + b1) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                } else {
                    const y = (a2 + b1) / (4 * x);
                    if (y === 0) {
                        const zwD = Math.abs(a2ae - b1ae);
                        if (zwD <= zxD) {
                            const z = (a2 - b1) / (4 * w);
                            return [x, y, z, w];
                        } else {
                            const z = (c1 + a3) / (4 * x);
                            return [x, y, z, w];
                        }
                    } else {
                        const zyD = Math.abs(b3ae - c2ae);
                        const zwD = Math.abs(a2ae - b1ae);
                        if (zwD <= zxD && zwD <= zyD) {
                            const z = (a2 - b1) / (4 * w);
                            return [x, y, z, w];
                        } else if (zyD <= zxD) {
                            const z = (b3 + c2) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const z = (c1 + a3) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                }
            }
        } else if (zxD <= yxD) {
            const z = (c1 + a3) / (4 * x);
            if (z === 0) {
                if (wxD <= yxD) {
                    const w = (b3 - c2) / (4 * x);
                    if (w === 0) {
                        {
                            const y = (a2 + b1) / (4 * x);
                            return [x, y, z, w];
                        }
                    } else {
                        const yzD = Math.abs(b3ae - c2ae);
                        const ywD = Math.abs(c1ae - a3ae);
                        if (ywD <= yxD && ywD <= yzD) {
                            const y = (c1 - a3) / (4 * w);
                            return [x, y, z, w];
                        } else if (yzD <= yxD) {
                            const y = (b3 + c2) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const y = (a2 + b1) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                } else {
                    const y = (a2 + b1) / (4 * x);
                    if (y === 0) {
                        {
                            const w = (b3 - c2) / (4 * x);
                            return [x, y, z, w];
                        }
                    } else {
                        const wyD = Math.abs(c1ae - a3ae);
                        const wzD = Math.abs(a2ae - b1ae);
                        if (wzD <= wxD && wzD <= wyD) {
                            const w = (a2 - b1) / (4 * z);
                            return [x, y, z, w];
                        } else if (wyD <= wxD) {
                            const w = (c1 - a3) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const w = (b3 - c2) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                }
            } else {
                const yzD = Math.abs(b3ae - c2ae);
                const wzD = Math.abs(a2ae - b1ae);
                if (wzD <= yxD && wzD <= wxD && wzD <= yzD) {
                    const w = (a2 - b1) / (4 * z);
                    if (w === 0) {
                        const yzD = Math.abs(b3ae - c2ae);
                        if (yzD <= yxD) {
                            const y = (b3 + c2) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const y = (a2 + b1) / (4 * x);
                            return [x, y, z, w];
                        }
                    } else {
                        const yzD = Math.abs(b3ae - c2ae);
                        const ywD = Math.abs(c1ae - a3ae);
                        if (ywD <= yxD && ywD <= yzD) {
                            const y = (c1 - a3) / (4 * w);
                            return [x, y, z, w];
                        } else if (yzD <= yxD) {
                            const y = (b3 + c2) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const y = (a2 + b1) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                } else if (yzD <= yxD && yzD <= wxD) {
                    const y = (b3 + c2) / (4 * z);
                    if (y === 0) {
                        const wzD = Math.abs(a2ae - b1ae);
                        if (wzD <= wxD) {
                            const w = (a2 - b1) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const w = (b3 - c2) / (4 * x);
                            return [x, y, z, w];
                        }
                    } else {
                        const wyD = Math.abs(c1ae - a3ae);
                        const wzD = Math.abs(a2ae - b1ae);
                        if (wzD <= wxD && wzD <= wyD) {
                            const w = (a2 - b1) / (4 * z);
                            return [x, y, z, w];
                        } else if (wyD <= wxD) {
                            const w = (c1 - a3) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const w = (b3 - c2) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                } else if (wxD <= yxD) {
                    const w = (b3 - c2) / (4 * x);
                    if (w === 0) {
                        const yzD = Math.abs(b3ae - c2ae);
                        if (yzD <= yxD) {
                            const y = (b3 + c2) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const y = (a2 + b1) / (4 * x);
                            return [x, y, z, w];
                        }
                    } else {
                        const yzD = Math.abs(b3ae - c2ae);
                        const ywD = Math.abs(c1ae - a3ae);
                        if (ywD <= yxD && ywD <= yzD) {
                            const y = (c1 - a3) / (4 * w);
                            return [x, y, z, w];
                        } else if (yzD <= yxD) {
                            const y = (b3 + c2) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const y = (a2 + b1) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                } else {
                    const y = (a2 + b1) / (4 * x);
                    if (y === 0) {
                        const wzD = Math.abs(a2ae - b1ae);
                        if (wzD <= wxD) {
                            const w = (a2 - b1) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const w = (b3 - c2) / (4 * x);
                            return [x, y, z, w];
                        }
                    } else {
                        const wyD = Math.abs(c1ae - a3ae);
                        const wzD = Math.abs(a2ae - b1ae);
                        if (wzD <= wxD && wzD <= wyD) {
                            const w = (a2 - b1) / (4 * z);
                            return [x, y, z, w];
                        } else if (wyD <= wxD) {
                            const w = (c1 - a3) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const w = (b3 - c2) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                }
            }
        } else {
            const y = (a2 + b1) / (4 * x);
            if (y === 0) {
                if (wxD <= zxD) {
                    const w = (b3 - c2) / (4 * x);
                    if (w === 0) {
                        {
                            const z = (c1 + a3) / (4 * x);
                            return [x, y, z, w];
                        }
                    } else {
                        const zyD = Math.abs(b3ae - c2ae);
                        const zwD = Math.abs(a2ae - b1ae);
                        if (zwD <= zxD && zwD <= zyD) {
                            const z = (a2 - b1) / (4 * w);
                            return [x, y, z, w];
                        } else if (zyD <= zxD) {
                            const z = (b3 + c2) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const z = (c1 + a3) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                } else {
                    const z = (c1 + a3) / (4 * x);
                    if (z === 0) {
                        {
                            const w = (b3 - c2) / (4 * x);
                            return [x, y, z, w];
                        }
                    } else {
                        const wyD = Math.abs(c1ae - a3ae);
                        const wzD = Math.abs(a2ae - b1ae);
                        if (wzD <= wxD && wzD <= wyD) {
                            const w = (a2 - b1) / (4 * z);
                            return [x, y, z, w];
                        } else if (wyD <= wxD) {
                            const w = (c1 - a3) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const w = (b3 - c2) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                }
            } else {
                const zyD = Math.abs(b3ae - c2ae);
                const wyD = Math.abs(c1ae - a3ae);
                if (wyD <= zxD && wyD <= wxD && wyD <= zyD) {
                    const w = (c1 - a3) / (4 * y);
                    if (w === 0) {
                        const zyD = Math.abs(b3ae - c2ae);
                        if (zyD <= zxD) {
                            const z = (b3 + c2) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const z = (c1 + a3) / (4 * x);
                            return [x, y, z, w];
                        }
                    } else {
                        const zyD = Math.abs(b3ae - c2ae);
                        const zwD = Math.abs(a2ae - b1ae);
                        if (zwD <= zxD && zwD <= zyD) {
                            const z = (a2 - b1) / (4 * w);
                            return [x, y, z, w];
                        } else if (zyD <= zxD) {
                            const z = (b3 + c2) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const z = (c1 + a3) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                } else if (zyD <= zxD && zyD <= wxD) {
                    const z = (b3 + c2) / (4 * y);
                    if (z === 0) {
                        const wyD = Math.abs(c1ae - a3ae);
                        if (wyD <= wxD) {
                            const w = (c1 - a3) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const w = (b3 - c2) / (4 * x);
                            return [x, y, z, w];
                        }
                    } else {
                        const wyD = Math.abs(c1ae - a3ae);
                        const wzD = Math.abs(a2ae - b1ae);
                        if (wzD <= wxD && wzD <= wyD) {
                            const w = (a2 - b1) / (4 * z);
                            return [x, y, z, w];
                        } else if (wyD <= wxD) {
                            const w = (c1 - a3) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const w = (b3 - c2) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                } else if (wxD <= zxD) {
                    const w = (b3 - c2) / (4 * x);
                    if (w === 0) {
                        const zyD = Math.abs(b3ae - c2ae);
                        if (zyD <= zxD) {
                            const z = (b3 + c2) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const z = (c1 + a3) / (4 * x);
                            return [x, y, z, w];
                        }
                    } else {
                        const zyD = Math.abs(b3ae - c2ae);
                        const zwD = Math.abs(a2ae - b1ae);
                        if (zwD <= zxD && zwD <= zyD) {
                            const z = (a2 - b1) / (4 * w);
                            return [x, y, z, w];
                        } else if (zyD <= zxD) {
                            const z = (b3 + c2) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const z = (c1 + a3) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                } else {
                    const z = (c1 + a3) / (4 * x);
                    if (z === 0) {
                        const wyD = Math.abs(c1ae - a3ae);
                        if (wyD <= wxD) {
                            const w = (c1 - a3) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const w = (b3 - c2) / (4 * x);
                            return [x, y, z, w];
                        }
                    } else {
                        const wyD = Math.abs(c1ae - a3ae);
                        const wzD = Math.abs(a2ae - b1ae);
                        if (wzD <= wxD && wzD <= wyD) {
                            const w = (a2 - b1) / (4 * z);
                            return [x, y, z, w];
                        } else if (wyD <= wxD) {
                            const w = (c1 - a3) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const w = (b3 - c2) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                }
            }
        }
    } else if (sy >= sw && sy >= sz) {
        if (sy < 0) {
            throw new Error("not a pure rotation matrix");
        }
        const y = .5 * Math.sqrt(sy);
        const xyD = Math.abs(a2ae - b1ae);
        const zyD = Math.abs(b3ae - c2ae);
        const wyD = Math.abs(c1ae - a3ae);
        if (wyD <= xyD && wyD <= zyD) {
            const w = (c1 - a3) / (4 * y);
            if (w === 0) {
                if (zyD <= xyD) {
                    const z = (b3 + c2) / (4 * y);
                    if (z === 0) {
                        {
                            const x = (a2 + b1) / (4 * y);
                            return [x, y, z, w];
                        }
                    } else {
                        const xzD = Math.abs(c1ae - a3ae);
                        const xwD = Math.abs(b3ae - c2ae);
                        if (xwD <= xyD && xwD <= xzD) {
                            const x = (b3 - c2) / (4 * w);
                            return [x, y, z, w];
                        } else if (xzD <= xyD) {
                            const x = (c1 + a3) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const x = (a2 + b1) / (4 * y);
                            return [x, y, z, w];
                        }
                    }
                } else {
                    const x = (a2 + b1) / (4 * y);
                    if (x === 0) {
                        {
                            const z = (b3 + c2) / (4 * y);
                            return [x, y, z, w];
                        }
                    } else {
                        const zxD = Math.abs(c1ae - a3ae);
                        const zwD = Math.abs(a2ae - b1ae);
                        if (zwD <= zxD && zwD <= zyD) {
                            const z = (a2 - b1) / (4 * w);
                            return [x, y, z, w];
                        } else if (zyD <= zxD) {
                            const z = (b3 + c2) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const z = (c1 + a3) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                }
            } else {
                const xwD = Math.abs(b3ae - c2ae);
                const zwD = Math.abs(a2ae - b1ae);
                if (zwD <= xyD && zwD <= zyD && zwD <= xwD) {
                    const z = (a2 - b1) / (4 * w);
                    if (z === 0) {
                        const xwD = Math.abs(b3ae - c2ae);
                        if (xwD <= xyD) {
                            const x = (b3 - c2) / (4 * w);
                            return [x, y, z, w];
                        } else {
                            const x = (a2 + b1) / (4 * y);
                            return [x, y, z, w];
                        }
                    } else {
                        const xzD = Math.abs(c1ae - a3ae);
                        const xwD = Math.abs(b3ae - c2ae);
                        if (xwD <= xyD && xwD <= xzD) {
                            const x = (b3 - c2) / (4 * w);
                            return [x, y, z, w];
                        } else if (xzD <= xyD) {
                            const x = (c1 + a3) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const x = (a2 + b1) / (4 * y);
                            return [x, y, z, w];
                        }
                    }
                } else if (xwD <= xyD && xwD <= zyD) {
                    const x = (b3 - c2) / (4 * w);
                    if (x === 0) {
                        const zwD = Math.abs(a2ae - b1ae);
                        if (zwD <= zyD) {
                            const z = (a2 - b1) / (4 * w);
                            return [x, y, z, w];
                        } else {
                            const z = (b3 + c2) / (4 * y);
                            return [x, y, z, w];
                        }
                    } else {
                        const zxD = Math.abs(c1ae - a3ae);
                        const zwD = Math.abs(a2ae - b1ae);
                        if (zwD <= zxD && zwD <= zyD) {
                            const z = (a2 - b1) / (4 * w);
                            return [x, y, z, w];
                        } else if (zyD <= zxD) {
                            const z = (b3 + c2) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const z = (c1 + a3) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                } else if (zyD <= xyD) {
                    const z = (b3 + c2) / (4 * y);
                    if (z === 0) {
                        const xwD = Math.abs(b3ae - c2ae);
                        if (xwD <= xyD) {
                            const x = (b3 - c2) / (4 * w);
                            return [x, y, z, w];
                        } else {
                            const x = (a2 + b1) / (4 * y);
                            return [x, y, z, w];
                        }
                    } else {
                        const xzD = Math.abs(c1ae - a3ae);
                        const xwD = Math.abs(b3ae - c2ae);
                        if (xwD <= xyD && xwD <= xzD) {
                            const x = (b3 - c2) / (4 * w);
                            return [x, y, z, w];
                        } else if (xzD <= xyD) {
                            const x = (c1 + a3) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const x = (a2 + b1) / (4 * y);
                            return [x, y, z, w];
                        }
                    }
                } else {
                    const x = (a2 + b1) / (4 * y);
                    if (x === 0) {
                        const zwD = Math.abs(a2ae - b1ae);
                        if (zwD <= zyD) {
                            const z = (a2 - b1) / (4 * w);
                            return [x, y, z, w];
                        } else {
                            const z = (b3 + c2) / (4 * y);
                            return [x, y, z, w];
                        }
                    } else {
                        const zxD = Math.abs(c1ae - a3ae);
                        const zwD = Math.abs(a2ae - b1ae);
                        if (zwD <= zxD && zwD <= zyD) {
                            const z = (a2 - b1) / (4 * w);
                            return [x, y, z, w];
                        } else if (zyD <= zxD) {
                            const z = (b3 + c2) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const z = (c1 + a3) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                }
            }
        } else if (zyD <= xyD) {
            const z = (b3 + c2) / (4 * y);
            if (z === 0) {
                if (wyD <= xyD) {
                    const w = (c1 - a3) / (4 * y);
                    if (w === 0) {
                        {
                            const x = (a2 + b1) / (4 * y);
                            return [x, y, z, w];
                        }
                    } else {
                        const xzD = Math.abs(c1ae - a3ae);
                        const xwD = Math.abs(b3ae - c2ae);
                        if (xwD <= xyD && xwD <= xzD) {
                            const x = (b3 - c2) / (4 * w);
                            return [x, y, z, w];
                        } else if (xzD <= xyD) {
                            const x = (c1 + a3) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const x = (a2 + b1) / (4 * y);
                            return [x, y, z, w];
                        }
                    }
                } else {
                    const x = (a2 + b1) / (4 * y);
                    if (x === 0) {
                        {
                            const w = (c1 - a3) / (4 * y);
                            return [x, y, z, w];
                        }
                    } else {
                        const wxD = Math.abs(b3ae - c2ae);
                        const wzD = Math.abs(a2ae - b1ae);
                        if (wzD <= wxD && wzD <= wyD) {
                            const w = (a2 - b1) / (4 * z);
                            return [x, y, z, w];
                        } else if (wyD <= wxD) {
                            const w = (c1 - a3) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const w = (b3 - c2) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                }
            } else {
                const xzD = Math.abs(c1ae - a3ae);
                const wzD = Math.abs(a2ae - b1ae);
                if (wzD <= xyD && wzD <= wyD && wzD <= xzD) {
                    const w = (a2 - b1) / (4 * z);
                    if (w === 0) {
                        const xzD = Math.abs(c1ae - a3ae);
                        if (xzD <= xyD) {
                            const x = (c1 + a3) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const x = (a2 + b1) / (4 * y);
                            return [x, y, z, w];
                        }
                    } else {
                        const xzD = Math.abs(c1ae - a3ae);
                        const xwD = Math.abs(b3ae - c2ae);
                        if (xwD <= xyD && xwD <= xzD) {
                            const x = (b3 - c2) / (4 * w);
                            return [x, y, z, w];
                        } else if (xzD <= xyD) {
                            const x = (c1 + a3) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const x = (a2 + b1) / (4 * y);
                            return [x, y, z, w];
                        }
                    }
                } else if (xzD <= xyD && xzD <= wyD) {
                    const x = (c1 + a3) / (4 * z);
                    if (x === 0) {
                        const wzD = Math.abs(a2ae - b1ae);
                        if (wzD <= wyD) {
                            const w = (a2 - b1) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const w = (c1 - a3) / (4 * y);
                            return [x, y, z, w];
                        }
                    } else {
                        const wxD = Math.abs(b3ae - c2ae);
                        const wzD = Math.abs(a2ae - b1ae);
                        if (wzD <= wxD && wzD <= wyD) {
                            const w = (a2 - b1) / (4 * z);
                            return [x, y, z, w];
                        } else if (wyD <= wxD) {
                            const w = (c1 - a3) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const w = (b3 - c2) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                } else if (wyD <= xyD) {
                    const w = (c1 - a3) / (4 * y);
                    if (w === 0) {
                        const xzD = Math.abs(c1ae - a3ae);
                        if (xzD <= xyD) {
                            const x = (c1 + a3) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const x = (a2 + b1) / (4 * y);
                            return [x, y, z, w];
                        }
                    } else {
                        const xzD = Math.abs(c1ae - a3ae);
                        const xwD = Math.abs(b3ae - c2ae);
                        if (xwD <= xyD && xwD <= xzD) {
                            const x = (b3 - c2) / (4 * w);
                            return [x, y, z, w];
                        } else if (xzD <= xyD) {
                            const x = (c1 + a3) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const x = (a2 + b1) / (4 * y);
                            return [x, y, z, w];
                        }
                    }
                } else {
                    const x = (a2 + b1) / (4 * y);
                    if (x === 0) {
                        const wzD = Math.abs(a2ae - b1ae);
                        if (wzD <= wyD) {
                            const w = (a2 - b1) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const w = (c1 - a3) / (4 * y);
                            return [x, y, z, w];
                        }
                    } else {
                        const wxD = Math.abs(b3ae - c2ae);
                        const wzD = Math.abs(a2ae - b1ae);
                        if (wzD <= wxD && wzD <= wyD) {
                            const w = (a2 - b1) / (4 * z);
                            return [x, y, z, w];
                        } else if (wyD <= wxD) {
                            const w = (c1 - a3) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const w = (b3 - c2) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                }
            }
        } else {
            const x = (a2 + b1) / (4 * y);
            if (x === 0) {
                if (wyD <= zyD) {
                    const w = (c1 - a3) / (4 * y);
                    if (w === 0) {
                        {
                            const z = (b3 + c2) / (4 * y);
                            return [x, y, z, w];
                        }
                    } else {
                        const zxD = Math.abs(c1ae - a3ae);
                        const zwD = Math.abs(a2ae - b1ae);
                        if (zwD <= zxD && zwD <= zyD) {
                            const z = (a2 - b1) / (4 * w);
                            return [x, y, z, w];
                        } else if (zyD <= zxD) {
                            const z = (b3 + c2) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const z = (c1 + a3) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                } else {
                    const z = (b3 + c2) / (4 * y);
                    if (z === 0) {
                        {
                            const w = (c1 - a3) / (4 * y);
                            return [x, y, z, w];
                        }
                    } else {
                        const wxD = Math.abs(b3ae - c2ae);
                        const wzD = Math.abs(a2ae - b1ae);
                        if (wzD <= wxD && wzD <= wyD) {
                            const w = (a2 - b1) / (4 * z);
                            return [x, y, z, w];
                        } else if (wyD <= wxD) {
                            const w = (c1 - a3) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const w = (b3 - c2) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                }
            } else {
                const zxD = Math.abs(c1ae - a3ae);
                const wxD = Math.abs(b3ae - c2ae);
                if (wyD <= zxD && wyD <= wxD && wyD <= zyD) {
                    const w = (c1 - a3) / (4 * y);
                    if (w === 0) {
                        const zxD = Math.abs(c1ae - a3ae);
                        if (zyD <= zxD) {
                            const z = (b3 + c2) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const z = (c1 + a3) / (4 * x);
                            return [x, y, z, w];
                        }
                    } else {
                        const zxD = Math.abs(c1ae - a3ae);
                        const zwD = Math.abs(a2ae - b1ae);
                        if (zwD <= zxD && zwD <= zyD) {
                            const z = (a2 - b1) / (4 * w);
                            return [x, y, z, w];
                        } else if (zyD <= zxD) {
                            const z = (b3 + c2) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const z = (c1 + a3) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                } else if (zyD <= zxD && zyD <= wxD) {
                    const z = (b3 + c2) / (4 * y);
                    if (z === 0) {
                        const wxD = Math.abs(b3ae - c2ae);
                        if (wyD <= wxD) {
                            const w = (c1 - a3) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const w = (b3 - c2) / (4 * x);
                            return [x, y, z, w];
                        }
                    } else {
                        const wxD = Math.abs(b3ae - c2ae);
                        const wzD = Math.abs(a2ae - b1ae);
                        if (wzD <= wxD && wzD <= wyD) {
                            const w = (a2 - b1) / (4 * z);
                            return [x, y, z, w];
                        } else if (wyD <= wxD) {
                            const w = (c1 - a3) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const w = (b3 - c2) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                } else if (wxD <= zxD) {
                    const w = (b3 - c2) / (4 * x);
                    if (w === 0) {
                        const zxD = Math.abs(c1ae - a3ae);
                        if (zyD <= zxD) {
                            const z = (b3 + c2) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const z = (c1 + a3) / (4 * x);
                            return [x, y, z, w];
                        }
                    } else {
                        const zxD = Math.abs(c1ae - a3ae);
                        const zwD = Math.abs(a2ae - b1ae);
                        if (zwD <= zxD && zwD <= zyD) {
                            const z = (a2 - b1) / (4 * w);
                            return [x, y, z, w];
                        } else if (zyD <= zxD) {
                            const z = (b3 + c2) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const z = (c1 + a3) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                } else {
                    const z = (c1 + a3) / (4 * x);
                    if (z === 0) {
                        const wxD = Math.abs(b3ae - c2ae);
                        if (wyD <= wxD) {
                            const w = (c1 - a3) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const w = (b3 - c2) / (4 * x);
                            return [x, y, z, w];
                        }
                    } else {
                        const wxD = Math.abs(b3ae - c2ae);
                        const wzD = Math.abs(a2ae - b1ae);
                        if (wzD <= wxD && wzD <= wyD) {
                            const w = (a2 - b1) / (4 * z);
                            return [x, y, z, w];
                        } else if (wyD <= wxD) {
                            const w = (c1 - a3) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const w = (b3 - c2) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                }
            }
        }
    } else if (sz >= sw) {
        if (sz < 0) {
            throw new Error("not a pure rotation matrix");
        }
        const z = .5 * Math.sqrt(sz);
        const xzD = Math.abs(c1ae - a3ae);
        const yzD = Math.abs(b3ae - c2ae);
        const wzD = Math.abs(a2ae - b1ae);
        if (wzD <= xzD && wzD <= yzD) {
            const w = (a2 - b1) / (4 * z);
            if (w === 0) {
                if (yzD <= xzD) {
                    const y = (b3 + c2) / (4 * z);
                    if (y === 0) {
                        {
                            const x = (c1 + a3) / (4 * z);
                            return [x, y, z, w];
                        }
                    } else {
                        const xyD = Math.abs(a2ae - b1ae);
                        const xwD = Math.abs(b3ae - c2ae);
                        if (xwD <= xyD && xwD <= xzD) {
                            const x = (b3 - c2) / (4 * w);
                            return [x, y, z, w];
                        } else if (xzD <= xyD) {
                            const x = (c1 + a3) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const x = (a2 + b1) / (4 * y);
                            return [x, y, z, w];
                        }
                    }
                } else {
                    const x = (c1 + a3) / (4 * z);
                    if (x === 0) {
                        {
                            const y = (b3 + c2) / (4 * z);
                            return [x, y, z, w];
                        }
                    } else {
                        const yxD = Math.abs(a2ae - b1ae);
                        const ywD = Math.abs(c1ae - a3ae);
                        if (ywD <= yxD && ywD <= yzD) {
                            const y = (c1 - a3) / (4 * w);
                            return [x, y, z, w];
                        } else if (yzD <= yxD) {
                            const y = (b3 + c2) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const y = (a2 + b1) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                }
            } else {
                const xwD = Math.abs(b3ae - c2ae);
                const ywD = Math.abs(c1ae - a3ae);
                if (ywD <= xzD && ywD <= yzD && ywD <= xwD) {
                    const y = (c1 - a3) / (4 * w);
                    if (y === 0) {
                        const xwD = Math.abs(b3ae - c2ae);
                        if (xwD <= xzD) {
                            const x = (b3 - c2) / (4 * w);
                            return [x, y, z, w];
                        } else {
                            const x = (c1 + a3) / (4 * z);
                            return [x, y, z, w];
                        }
                    } else {
                        const xyD = Math.abs(a2ae - b1ae);
                        const xwD = Math.abs(b3ae - c2ae);
                        if (xwD <= xyD && xwD <= xzD) {
                            const x = (b3 - c2) / (4 * w);
                            return [x, y, z, w];
                        } else if (xzD <= xyD) {
                            const x = (c1 + a3) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const x = (a2 + b1) / (4 * y);
                            return [x, y, z, w];
                        }
                    }
                } else if (xwD <= xzD && xwD <= yzD) {
                    const x = (b3 - c2) / (4 * w);
                    if (x === 0) {
                        const ywD = Math.abs(c1ae - a3ae);
                        if (ywD <= yzD) {
                            const y = (c1 - a3) / (4 * w);
                            return [x, y, z, w];
                        } else {
                            const y = (b3 + c2) / (4 * z);
                            return [x, y, z, w];
                        }
                    } else {
                        const yxD = Math.abs(a2ae - b1ae);
                        const ywD = Math.abs(c1ae - a3ae);
                        if (ywD <= yxD && ywD <= yzD) {
                            const y = (c1 - a3) / (4 * w);
                            return [x, y, z, w];
                        } else if (yzD <= yxD) {
                            const y = (b3 + c2) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const y = (a2 + b1) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                } else if (yzD <= xzD) {
                    const y = (b3 + c2) / (4 * z);
                    if (y === 0) {
                        const xwD = Math.abs(b3ae - c2ae);
                        if (xwD <= xzD) {
                            const x = (b3 - c2) / (4 * w);
                            return [x, y, z, w];
                        } else {
                            const x = (c1 + a3) / (4 * z);
                            return [x, y, z, w];
                        }
                    } else {
                        const xyD = Math.abs(a2ae - b1ae);
                        const xwD = Math.abs(b3ae - c2ae);
                        if (xwD <= xyD && xwD <= xzD) {
                            const x = (b3 - c2) / (4 * w);
                            return [x, y, z, w];
                        } else if (xzD <= xyD) {
                            const x = (c1 + a3) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const x = (a2 + b1) / (4 * y);
                            return [x, y, z, w];
                        }
                    }
                } else {
                    const x = (c1 + a3) / (4 * z);
                    if (x === 0) {
                        const ywD = Math.abs(c1ae - a3ae);
                        if (ywD <= yzD) {
                            const y = (c1 - a3) / (4 * w);
                            return [x, y, z, w];
                        } else {
                            const y = (b3 + c2) / (4 * z);
                            return [x, y, z, w];
                        }
                    } else {
                        const yxD = Math.abs(a2ae - b1ae);
                        const ywD = Math.abs(c1ae - a3ae);
                        if (ywD <= yxD && ywD <= yzD) {
                            const y = (c1 - a3) / (4 * w);
                            return [x, y, z, w];
                        } else if (yzD <= yxD) {
                            const y = (b3 + c2) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const y = (a2 + b1) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                }
            }
        } else if (yzD <= xzD) {
            const y = (b3 + c2) / (4 * z);
            if (y === 0) {
                if (wzD <= xzD) {
                    const w = (a2 - b1) / (4 * z);
                    if (w === 0) {
                        {
                            const x = (c1 + a3) / (4 * z);
                            return [x, y, z, w];
                        }
                    } else {
                        const xyD = Math.abs(a2ae - b1ae);
                        const xwD = Math.abs(b3ae - c2ae);
                        if (xwD <= xyD && xwD <= xzD) {
                            const x = (b3 - c2) / (4 * w);
                            return [x, y, z, w];
                        } else if (xzD <= xyD) {
                            const x = (c1 + a3) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const x = (a2 + b1) / (4 * y);
                            return [x, y, z, w];
                        }
                    }
                } else {
                    const x = (c1 + a3) / (4 * z);
                    if (x === 0) {
                        {
                            const w = (a2 - b1) / (4 * z);
                            return [x, y, z, w];
                        }
                    } else {
                        const wxD = Math.abs(b3ae - c2ae);
                        const wyD = Math.abs(c1ae - a3ae);
                        if (wzD <= wxD && wzD <= wyD) {
                            const w = (a2 - b1) / (4 * z);
                            return [x, y, z, w];
                        } else if (wyD <= wxD) {
                            const w = (c1 - a3) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const w = (b3 - c2) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                }
            } else {
                const xyD = Math.abs(a2ae - b1ae);
                const wyD = Math.abs(c1ae - a3ae);
                if (wzD <= xyD && wzD <= wyD && wzD <= xzD) {
                    const w = (a2 - b1) / (4 * z);
                    if (w === 0) {
                        const xyD = Math.abs(a2ae - b1ae);
                        if (xzD <= xyD) {
                            const x = (c1 + a3) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const x = (a2 + b1) / (4 * y);
                            return [x, y, z, w];
                        }
                    } else {
                        const xyD = Math.abs(a2ae - b1ae);
                        const xwD = Math.abs(b3ae - c2ae);
                        if (xwD <= xyD && xwD <= xzD) {
                            const x = (b3 - c2) / (4 * w);
                            return [x, y, z, w];
                        } else if (xzD <= xyD) {
                            const x = (c1 + a3) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const x = (a2 + b1) / (4 * y);
                            return [x, y, z, w];
                        }
                    }
                } else if (xzD <= xyD && xzD <= wyD) {
                    const x = (c1 + a3) / (4 * z);
                    if (x === 0) {
                        const wyD = Math.abs(c1ae - a3ae);
                        if (wzD <= wyD) {
                            const w = (a2 - b1) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const w = (c1 - a3) / (4 * y);
                            return [x, y, z, w];
                        }
                    } else {
                        const wxD = Math.abs(b3ae - c2ae);
                        const wyD = Math.abs(c1ae - a3ae);
                        if (wzD <= wxD && wzD <= wyD) {
                            const w = (a2 - b1) / (4 * z);
                            return [x, y, z, w];
                        } else if (wyD <= wxD) {
                            const w = (c1 - a3) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const w = (b3 - c2) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                } else if (wyD <= xyD) {
                    const w = (c1 - a3) / (4 * y);
                    if (w === 0) {
                        const xyD = Math.abs(a2ae - b1ae);
                        if (xzD <= xyD) {
                            const x = (c1 + a3) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const x = (a2 + b1) / (4 * y);
                            return [x, y, z, w];
                        }
                    } else {
                        const xyD = Math.abs(a2ae - b1ae);
                        const xwD = Math.abs(b3ae - c2ae);
                        if (xwD <= xyD && xwD <= xzD) {
                            const x = (b3 - c2) / (4 * w);
                            return [x, y, z, w];
                        } else if (xzD <= xyD) {
                            const x = (c1 + a3) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const x = (a2 + b1) / (4 * y);
                            return [x, y, z, w];
                        }
                    }
                } else {
                    const x = (a2 + b1) / (4 * y);
                    if (x === 0) {
                        const wyD = Math.abs(c1ae - a3ae);
                        if (wzD <= wyD) {
                            const w = (a2 - b1) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const w = (c1 - a3) / (4 * y);
                            return [x, y, z, w];
                        }
                    } else {
                        const wxD = Math.abs(b3ae - c2ae);
                        const wyD = Math.abs(c1ae - a3ae);
                        if (wzD <= wxD && wzD <= wyD) {
                            const w = (a2 - b1) / (4 * z);
                            return [x, y, z, w];
                        } else if (wyD <= wxD) {
                            const w = (c1 - a3) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const w = (b3 - c2) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                }
            }
        } else {
            const x = (c1 + a3) / (4 * z);
            if (x === 0) {
                if (wzD <= yzD) {
                    const w = (a2 - b1) / (4 * z);
                    if (w === 0) {
                        {
                            const y = (b3 + c2) / (4 * z);
                            return [x, y, z, w];
                        }
                    } else {
                        const yxD = Math.abs(a2ae - b1ae);
                        const ywD = Math.abs(c1ae - a3ae);
                        if (ywD <= yxD && ywD <= yzD) {
                            const y = (c1 - a3) / (4 * w);
                            return [x, y, z, w];
                        } else if (yzD <= yxD) {
                            const y = (b3 + c2) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const y = (a2 + b1) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                } else {
                    const y = (b3 + c2) / (4 * z);
                    if (y === 0) {
                        {
                            const w = (a2 - b1) / (4 * z);
                            return [x, y, z, w];
                        }
                    } else {
                        const wxD = Math.abs(b3ae - c2ae);
                        const wyD = Math.abs(c1ae - a3ae);
                        if (wzD <= wxD && wzD <= wyD) {
                            const w = (a2 - b1) / (4 * z);
                            return [x, y, z, w];
                        } else if (wyD <= wxD) {
                            const w = (c1 - a3) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const w = (b3 - c2) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                }
            } else {
                const yxD = Math.abs(a2ae - b1ae);
                const wxD = Math.abs(b3ae - c2ae);
                if (wzD <= yxD && wzD <= wxD && wzD <= yzD) {
                    const w = (a2 - b1) / (4 * z);
                    if (w === 0) {
                        const yxD = Math.abs(a2ae - b1ae);
                        if (yzD <= yxD) {
                            const y = (b3 + c2) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const y = (a2 + b1) / (4 * x);
                            return [x, y, z, w];
                        }
                    } else {
                        const yxD = Math.abs(a2ae - b1ae);
                        const ywD = Math.abs(c1ae - a3ae);
                        if (ywD <= yxD && ywD <= yzD) {
                            const y = (c1 - a3) / (4 * w);
                            return [x, y, z, w];
                        } else if (yzD <= yxD) {
                            const y = (b3 + c2) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const y = (a2 + b1) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                } else if (yzD <= yxD && yzD <= wxD) {
                    const y = (b3 + c2) / (4 * z);
                    if (y === 0) {
                        const wxD = Math.abs(b3ae - c2ae);
                        if (wzD <= wxD) {
                            const w = (a2 - b1) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const w = (b3 - c2) / (4 * x);
                            return [x, y, z, w];
                        }
                    } else {
                        const wxD = Math.abs(b3ae - c2ae);
                        const wyD = Math.abs(c1ae - a3ae);
                        if (wzD <= wxD && wzD <= wyD) {
                            const w = (a2 - b1) / (4 * z);
                            return [x, y, z, w];
                        } else if (wyD <= wxD) {
                            const w = (c1 - a3) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const w = (b3 - c2) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                } else if (wxD <= yxD) {
                    const w = (b3 - c2) / (4 * x);
                    if (w === 0) {
                        const yxD = Math.abs(a2ae - b1ae);
                        if (yzD <= yxD) {
                            const y = (b3 + c2) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const y = (a2 + b1) / (4 * x);
                            return [x, y, z, w];
                        }
                    } else {
                        const yxD = Math.abs(a2ae - b1ae);
                        const ywD = Math.abs(c1ae - a3ae);
                        if (ywD <= yxD && ywD <= yzD) {
                            const y = (c1 - a3) / (4 * w);
                            return [x, y, z, w];
                        } else if (yzD <= yxD) {
                            const y = (b3 + c2) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const y = (a2 + b1) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                } else {
                    const y = (a2 + b1) / (4 * x);
                    if (y === 0) {
                        const wxD = Math.abs(b3ae - c2ae);
                        if (wzD <= wxD) {
                            const w = (a2 - b1) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const w = (b3 - c2) / (4 * x);
                            return [x, y, z, w];
                        }
                    } else {
                        const wxD = Math.abs(b3ae - c2ae);
                        const wyD = Math.abs(c1ae - a3ae);
                        if (wzD <= wxD && wzD <= wyD) {
                            const w = (a2 - b1) / (4 * z);
                            return [x, y, z, w];
                        } else if (wyD <= wxD) {
                            const w = (c1 - a3) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const w = (b3 - c2) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                }
            }
        }
    } else {
        if (sw < 0) {
            throw new Error("not a pure rotation matrix");
        }
        const w = .5 * Math.sqrt(sw);
        const xwD = Math.abs(b3ae - c2ae);
        const ywD = Math.abs(c1ae - a3ae);
        const zwD = Math.abs(a2ae - b1ae);
        if (zwD <= xwD && zwD <= ywD) {
            const z = (a2 - b1) / (4 * w);
            if (z === 0) {
                if (ywD <= xwD) {
                    const y = (c1 - a3) / (4 * w);
                    if (y === 0) {
                        {
                            const x = (b3 - c2) / (4 * w);
                            return [x, y, z, w];
                        }
                    } else {
                        const xyD = Math.abs(a2ae - b1ae);
                        const xzD = Math.abs(c1ae - a3ae);
                        if (xwD <= xyD && xwD <= xzD) {
                            const x = (b3 - c2) / (4 * w);
                            return [x, y, z, w];
                        } else if (xzD <= xyD) {
                            const x = (c1 + a3) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const x = (a2 + b1) / (4 * y);
                            return [x, y, z, w];
                        }
                    }
                } else {
                    const x = (b3 - c2) / (4 * w);
                    if (x === 0) {
                        {
                            const y = (c1 - a3) / (4 * w);
                            return [x, y, z, w];
                        }
                    } else {
                        const yxD = Math.abs(a2ae - b1ae);
                        const yzD = Math.abs(b3ae - c2ae);
                        if (ywD <= yxD && ywD <= yzD) {
                            const y = (c1 - a3) / (4 * w);
                            return [x, y, z, w];
                        } else if (yzD <= yxD) {
                            const y = (b3 + c2) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const y = (a2 + b1) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                }
            } else {
                const xzD = Math.abs(c1ae - a3ae);
                const yzD = Math.abs(b3ae - c2ae);
                if (ywD <= xzD && ywD <= yzD && ywD <= xwD) {
                    const y = (c1 - a3) / (4 * w);
                    if (y === 0) {
                        const xzD = Math.abs(c1ae - a3ae);
                        if (xwD <= xzD) {
                            const x = (b3 - c2) / (4 * w);
                            return [x, y, z, w];
                        } else {
                            const x = (c1 + a3) / (4 * z);
                            return [x, y, z, w];
                        }
                    } else {
                        const xyD = Math.abs(a2ae - b1ae);
                        const xzD = Math.abs(c1ae - a3ae);
                        if (xwD <= xyD && xwD <= xzD) {
                            const x = (b3 - c2) / (4 * w);
                            return [x, y, z, w];
                        } else if (xzD <= xyD) {
                            const x = (c1 + a3) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const x = (a2 + b1) / (4 * y);
                            return [x, y, z, w];
                        }
                    }
                } else if (xwD <= xzD && xwD <= yzD) {
                    const x = (b3 - c2) / (4 * w);
                    if (x === 0) {
                        const yzD = Math.abs(b3ae - c2ae);
                        if (ywD <= yzD) {
                            const y = (c1 - a3) / (4 * w);
                            return [x, y, z, w];
                        } else {
                            const y = (b3 + c2) / (4 * z);
                            return [x, y, z, w];
                        }
                    } else {
                        const yxD = Math.abs(a2ae - b1ae);
                        const yzD = Math.abs(b3ae - c2ae);
                        if (ywD <= yxD && ywD <= yzD) {
                            const y = (c1 - a3) / (4 * w);
                            return [x, y, z, w];
                        } else if (yzD <= yxD) {
                            const y = (b3 + c2) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const y = (a2 + b1) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                } else if (yzD <= xzD) {
                    const y = (b3 + c2) / (4 * z);
                    if (y === 0) {
                        const xzD = Math.abs(c1ae - a3ae);
                        if (xwD <= xzD) {
                            const x = (b3 - c2) / (4 * w);
                            return [x, y, z, w];
                        } else {
                            const x = (c1 + a3) / (4 * z);
                            return [x, y, z, w];
                        }
                    } else {
                        const xyD = Math.abs(a2ae - b1ae);
                        const xzD = Math.abs(c1ae - a3ae);
                        if (xwD <= xyD && xwD <= xzD) {
                            const x = (b3 - c2) / (4 * w);
                            return [x, y, z, w];
                        } else if (xzD <= xyD) {
                            const x = (c1 + a3) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const x = (a2 + b1) / (4 * y);
                            return [x, y, z, w];
                        }
                    }
                } else {
                    const x = (c1 + a3) / (4 * z);
                    if (x === 0) {
                        const yzD = Math.abs(b3ae - c2ae);
                        if (ywD <= yzD) {
                            const y = (c1 - a3) / (4 * w);
                            return [x, y, z, w];
                        } else {
                            const y = (b3 + c2) / (4 * z);
                            return [x, y, z, w];
                        }
                    } else {
                        const yxD = Math.abs(a2ae - b1ae);
                        const yzD = Math.abs(b3ae - c2ae);
                        if (ywD <= yxD && ywD <= yzD) {
                            const y = (c1 - a3) / (4 * w);
                            return [x, y, z, w];
                        } else if (yzD <= yxD) {
                            const y = (b3 + c2) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const y = (a2 + b1) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                }
            }
        } else if (ywD <= xwD) {
            const y = (c1 - a3) / (4 * w);
            if (y === 0) {
                if (zwD <= xwD) {
                    const z = (a2 - b1) / (4 * w);
                    if (z === 0) {
                        {
                            const x = (b3 - c2) / (4 * w);
                            return [x, y, z, w];
                        }
                    } else {
                        const xyD = Math.abs(a2ae - b1ae);
                        const xzD = Math.abs(c1ae - a3ae);
                        if (xwD <= xyD && xwD <= xzD) {
                            const x = (b3 - c2) / (4 * w);
                            return [x, y, z, w];
                        } else if (xzD <= xyD) {
                            const x = (c1 + a3) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const x = (a2 + b1) / (4 * y);
                            return [x, y, z, w];
                        }
                    }
                } else {
                    const x = (b3 - c2) / (4 * w);
                    if (x === 0) {
                        {
                            const z = (a2 - b1) / (4 * w);
                            return [x, y, z, w];
                        }
                    } else {
                        const zxD = Math.abs(c1ae - a3ae);
                        const zyD = Math.abs(b3ae - c2ae);
                        if (zwD <= zxD && zwD <= zyD) {
                            const z = (a2 - b1) / (4 * w);
                            return [x, y, z, w];
                        } else if (zyD <= zxD) {
                            const z = (b3 + c2) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const z = (c1 + a3) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                }
            } else {
                const xyD = Math.abs(a2ae - b1ae);
                const zyD = Math.abs(b3ae - c2ae);
                if (zwD <= xyD && zwD <= zyD && zwD <= xwD) {
                    const z = (a2 - b1) / (4 * w);
                    if (z === 0) {
                        const xyD = Math.abs(a2ae - b1ae);
                        if (xwD <= xyD) {
                            const x = (b3 - c2) / (4 * w);
                            return [x, y, z, w];
                        } else {
                            const x = (a2 + b1) / (4 * y);
                            return [x, y, z, w];
                        }
                    } else {
                        const xyD = Math.abs(a2ae - b1ae);
                        const xzD = Math.abs(c1ae - a3ae);
                        if (xwD <= xyD && xwD <= xzD) {
                            const x = (b3 - c2) / (4 * w);
                            return [x, y, z, w];
                        } else if (xzD <= xyD) {
                            const x = (c1 + a3) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const x = (a2 + b1) / (4 * y);
                            return [x, y, z, w];
                        }
                    }
                } else if (xwD <= xyD && xwD <= zyD) {
                    const x = (b3 - c2) / (4 * w);
                    if (x === 0) {
                        const zyD = Math.abs(b3ae - c2ae);
                        if (zwD <= zyD) {
                            const z = (a2 - b1) / (4 * w);
                            return [x, y, z, w];
                        } else {
                            const z = (b3 + c2) / (4 * y);
                            return [x, y, z, w];
                        }
                    } else {
                        const zxD = Math.abs(c1ae - a3ae);
                        const zyD = Math.abs(b3ae - c2ae);
                        if (zwD <= zxD && zwD <= zyD) {
                            const z = (a2 - b1) / (4 * w);
                            return [x, y, z, w];
                        } else if (zyD <= zxD) {
                            const z = (b3 + c2) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const z = (c1 + a3) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                } else if (zyD <= xyD) {
                    const z = (b3 + c2) / (4 * y);
                    if (z === 0) {
                        const xyD = Math.abs(a2ae - b1ae);
                        if (xwD <= xyD) {
                            const x = (b3 - c2) / (4 * w);
                            return [x, y, z, w];
                        } else {
                            const x = (a2 + b1) / (4 * y);
                            return [x, y, z, w];
                        }
                    } else {
                        const xyD = Math.abs(a2ae - b1ae);
                        const xzD = Math.abs(c1ae - a3ae);
                        if (xwD <= xyD && xwD <= xzD) {
                            const x = (b3 - c2) / (4 * w);
                            return [x, y, z, w];
                        } else if (xzD <= xyD) {
                            const x = (c1 + a3) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const x = (a2 + b1) / (4 * y);
                            return [x, y, z, w];
                        }
                    }
                } else {
                    const x = (a2 + b1) / (4 * y);
                    if (x === 0) {
                        const zyD = Math.abs(b3ae - c2ae);
                        if (zwD <= zyD) {
                            const z = (a2 - b1) / (4 * w);
                            return [x, y, z, w];
                        } else {
                            const z = (b3 + c2) / (4 * y);
                            return [x, y, z, w];
                        }
                    } else {
                        const zxD = Math.abs(c1ae - a3ae);
                        const zyD = Math.abs(b3ae - c2ae);
                        if (zwD <= zxD && zwD <= zyD) {
                            const z = (a2 - b1) / (4 * w);
                            return [x, y, z, w];
                        } else if (zyD <= zxD) {
                            const z = (b3 + c2) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const z = (c1 + a3) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                }
            }
        } else {
            const x = (b3 - c2) / (4 * w);
            if (x === 0) {
                if (zwD <= ywD) {
                    const z = (a2 - b1) / (4 * w);
                    if (z === 0) {
                        {
                            const y = (c1 - a3) / (4 * w);
                            return [x, y, z, w];
                        }
                    } else {
                        const yxD = Math.abs(a2ae - b1ae);
                        const yzD = Math.abs(b3ae - c2ae);
                        if (ywD <= yxD && ywD <= yzD) {
                            const y = (c1 - a3) / (4 * w);
                            return [x, y, z, w];
                        } else if (yzD <= yxD) {
                            const y = (b3 + c2) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const y = (a2 + b1) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                } else {
                    const y = (c1 - a3) / (4 * w);
                    if (y === 0) {
                        {
                            const z = (a2 - b1) / (4 * w);
                            return [x, y, z, w];
                        }
                    } else {
                        const zxD = Math.abs(c1ae - a3ae);
                        const zyD = Math.abs(b3ae - c2ae);
                        if (zwD <= zxD && zwD <= zyD) {
                            const z = (a2 - b1) / (4 * w);
                            return [x, y, z, w];
                        } else if (zyD <= zxD) {
                            const z = (b3 + c2) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const z = (c1 + a3) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                }
            } else {
                const yxD = Math.abs(a2ae - b1ae);
                const zxD = Math.abs(c1ae - a3ae);
                if (zwD <= yxD && zwD <= zxD && zwD <= ywD) {
                    const z = (a2 - b1) / (4 * w);
                    if (z === 0) {
                        const yxD = Math.abs(a2ae - b1ae);
                        if (ywD <= yxD) {
                            const y = (c1 - a3) / (4 * w);
                            return [x, y, z, w];
                        } else {
                            const y = (a2 + b1) / (4 * x);
                            return [x, y, z, w];
                        }
                    } else {
                        const yxD = Math.abs(a2ae - b1ae);
                        const yzD = Math.abs(b3ae - c2ae);
                        if (ywD <= yxD && ywD <= yzD) {
                            const y = (c1 - a3) / (4 * w);
                            return [x, y, z, w];
                        } else if (yzD <= yxD) {
                            const y = (b3 + c2) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const y = (a2 + b1) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                } else if (ywD <= yxD && ywD <= zxD) {
                    const y = (c1 - a3) / (4 * w);
                    if (y === 0) {
                        const zxD = Math.abs(c1ae - a3ae);
                        if (zwD <= zxD) {
                            const z = (a2 - b1) / (4 * w);
                            return [x, y, z, w];
                        } else {
                            const z = (c1 + a3) / (4 * x);
                            return [x, y, z, w];
                        }
                    } else {
                        const zxD = Math.abs(c1ae - a3ae);
                        const zyD = Math.abs(b3ae - c2ae);
                        if (zwD <= zxD && zwD <= zyD) {
                            const z = (a2 - b1) / (4 * w);
                            return [x, y, z, w];
                        } else if (zyD <= zxD) {
                            const z = (b3 + c2) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const z = (c1 + a3) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                } else if (zxD <= yxD) {
                    const z = (c1 + a3) / (4 * x);
                    if (z === 0) {
                        const yxD = Math.abs(a2ae - b1ae);
                        if (ywD <= yxD) {
                            const y = (c1 - a3) / (4 * w);
                            return [x, y, z, w];
                        } else {
                            const y = (a2 + b1) / (4 * x);
                            return [x, y, z, w];
                        }
                    } else {
                        const yxD = Math.abs(a2ae - b1ae);
                        const yzD = Math.abs(b3ae - c2ae);
                        if (ywD <= yxD && ywD <= yzD) {
                            const y = (c1 - a3) / (4 * w);
                            return [x, y, z, w];
                        } else if (yzD <= yxD) {
                            const y = (b3 + c2) / (4 * z);
                            return [x, y, z, w];
                        } else {
                            const y = (a2 + b1) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                } else {
                    const y = (a2 + b1) / (4 * x);
                    if (y === 0) {
                        const zxD = Math.abs(c1ae - a3ae);
                        if (zwD <= zxD) {
                            const z = (a2 - b1) / (4 * w);
                            return [x, y, z, w];
                        } else {
                            const z = (c1 + a3) / (4 * x);
                            return [x, y, z, w];
                        }
                    } else {
                        const zxD = Math.abs(c1ae - a3ae);
                        const zyD = Math.abs(b3ae - c2ae);
                        if (zwD <= zxD && zwD <= zyD) {
                            const z = (a2 - b1) / (4 * w);
                            return [x, y, z, w];
                        } else if (zyD <= zxD) {
                            const z = (b3 + c2) / (4 * y);
                            return [x, y, z, w];
                        } else {
                            const z = (c1 + a3) / (4 * x);
                            return [x, y, z, w];
                        }
                    }
                }
            }
        }
    }
}
