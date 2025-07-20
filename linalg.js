export function strV1([a]) {
       return `[${a}]`;
}

export function strV2([a1, a2]) {
       return `[${a1}, ${a2}]`;
}

export function strV3([a1, a2, a3]) {
       return `[${a1}, ${a2}, ${a3}]`;
}

export function strV4([a1, a2, a3, a4]) {
       return `[${a1}, ${a2}, ${a3}, ${a4}]`;
}

export function strM1([a]) {
       return `[${a}]`;
}

export function strM2([a11, a12, a21, a22]) {
       return `[${a11}, ${a12}, ${a21}, ${a22}]`;
}

export function strM3([a11, a12, a13, a21, a22, a23, a31, a32, a33]) {
       return `[${a11}, ${a12}, ${a13}, ${a21}, ${a22}, ${a23}, ${a31}, ${a32}, ${a33}]`;
}

export function strM4([a11, a12, a13, a14, a21, a22, a23, a24, a31, a32, a33, a34, a41, a42, a43, a44]) {
       return `[${a11}, ${a12}, ${a13}, ${a14}, ${a21}, ${a22}, ${a23}, ${a24}, ${a31}, ${a32}, ${a33}, ${a34}, ${a41}, ${a42}, ${a43}, ${a44}]`;
}

export function addV1([a], [b]) {
       return [a + b];
}

export function addV2([a1, a2], [b1, b2]) {
       return [a1 + b1, a2 + b2];
}

export function addV3([a1, a2, a3], [b1, b2, b3]) {
       return [a1 + b1, a2 + b2, a3 + b3];
}

export function addV4([a1, a2, a3, a4], [b1, b2, b3, b4]) {
       return [a1 + b1, a2 + b2, a3 + b3, a4 + b4];
}

export function subtractV1([a], [b]) {
       return [a - b];
}

export function subtractV2([a1, a2], [b1, b2]) {
       return [a1 - b1, a2 - b2];
}

export function subtractV3([a1, a2, a3], [b1, b2, b3]) {
       return [a1 - b1, a2 - b2, a3 - b3];
}

export function subtractV4([a1, a2, a3, a4], [b1, b2, b3, b4]) {
       return [a1 - b1, a2 - b2, a3 - b3, a4 - b4];
}

export function scaleV1(s, [a]) {
       return [s * a];
}

export function scaleV2(s, [a1, a2]) {
       return [s * a1, s * a2];
}

export function scaleV3(s, [a1, a2, a3]) {
       return [s * a1, s * a2, s * a3];
}

export function scaleV4(s, [a1, a2, a3, a4]) {
       return [s * a1, s * a2, s * a3, s * a4];
}

export function identityM1() {
       return [1];
}

export function identityM2() {
       return [
              1, 0,
              0, 1,
       ];
}

export function identityM3() {
       return [
              1, 0, 0,
              0, 1, 0,
              0, 0, 1,
       ];
}

export function identityM4() {
       return [
              1, 0, 0, 0,
              0, 1, 0, 0,
              0, 0, 1, 0,
              0, 0, 0, 1,
       ];
}

export function multM1V1([a], [b]) {
       return [
              a * b,
       ];
}

export function multM2V2([a11, a12, a21, a22], [b1, b2]) {
       return [
              a11 * b1 + a12 * b2,
              a21 * b1 + a22 * b2,
       ];
}

export function multM3V3([a11, a12, a13, a21, a22, a23, a31, a32, a33], [b1, b2, b3]) {
       return [
              a11 * b1 + a12 * b2 + a13 * b3,
              a21 * b1 + a22 * b2 + a23 * b3,
              a31 * b1 + a32 * b2 + a33 * b3,
       ];
}

export function multM4V4([a11, a12, a13, a14, a21, a22, a23, a24, a31, a32, a33, a34, a41, a42, a43, a44], [b1, b2, b3, b4]) {
       return [
              a11 * b1 + a12 * b2 + a13 * b3 + a14 * b4,
              a21 * b1 + a22 * b2 + a23 * b3 + a24 * b4,
              a31 * b1 + a32 * b2 + a33 * b3 + a34 * b4,
              a41 * b1 + a42 * b2 + a43 * b3 + a44 * b4,
       ];             
}

export function multM1([a], [b]) {
       return [c];
}

export function multM2([a11, a12, a21, a22], [b11, b12, b21, b22]) {
       return [
              a11 * b11 + a12 * b21,
              a11 * b12 + a12 * b22,
              
              a21 * b11 + a22 * b21,
              a21 * b12 + a22 * b22,
      ];
}

export function multM3([a11, a12, a13, a21, a22, a23, a31, a32, a33], [b11, b12, b13, b21, b22, b23, b31, b32, b33]) {
       return [
              a11 * b11 + a12 * b21 + a13 * b31,
              a11 * b12 + a12 * b22 + a13 * b32,
              a11 * b13 + a12 * b23 + a13 * b33,
              
              a21 * b11 + a22 * b21 + a23 * b31,
              a21 * b12 + a22 * b22 + a23 * b32,
              a21 * b13 + a22 * b23 + a23 * b33,
              
              a31 * b11 + a32 * b21 + a33 * b31,
              a31 * b12 + a32 * b22 + a33 * b32,
              a31 * b13 + a32 * b23 + a33 * b33,
       ];       
}

export function multM4([a11, a12, a13, a14, a21, a22, a23, a24, a31, a32, a33, a34, a41, a42, a43, a44],
       [b11, b12, b13, b14, b21, b22, b23, b24, b31, b32, b33, b34, b41, b42, b43, b44]) {
       return [
              a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41,
              a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42,
              a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43,
              a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44,

              a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41,
              a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42,
              a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43,
              a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44,

              a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41,
              a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42,
              a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43,
              a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44,
              
              a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41,
              a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42,
              a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43,
              a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44
       ];
}

export function composeAffineM1V1([a], [b]) {
       return [a, b, 
               0, 1];
}

export function decomposeAffineM2([a, b, _zero, _one]) {
       return [[a], [b]];
}

export function augmentV1([a]) {
       return [a, 1];
}

export function deaugmentV2([a, _one]) {
       return [a];
}

export function composeAffineM2V2([a11, a12, a21, a22], [b1, b2]) {
       return [a11, a12, b1,
               a21, a22, b2, 
               0, 0, 1];
}

export function decomposeAffineM3([a11, a12, b1, a21, a22, b2, _zero1, _zero2, _one]) {
       return [[a11, a12, a21, a22], 
                              [b1, b2]];
}

export function augmentV2([a1, a2]) {
       return [a1, a2, 1];
}

export function deaugmentV3([a1, a2, _one]) {
       return [a1, a2];
}


export function composeAffineM3V3([a11, a12, a13, a21, a22, a23, a31, a32, a33], [b1, b2, b3]) {
       return [a11, a12, a13, b1,
               a21, a22, a23, b2,
               a31, a32, a33, b3,
               0, 0, 0, 1];
}

export function decomposeAffineM4([a11, a12, a13, b1, a21, a22, a23, b2, a31, a32, a33, b3, _zero1, _zero2, _zero3, _one]) {
       return [[a11, a12, a13, a21, a22, a23, a31, a32, a33], 
                              [b1, b2, b3]];
}

export function augmentV3([a1, a2, a3]) {
       return [a1, a2, a3, 1];
}

export function deaugmentV4([a1, a2, a3, _one]) {
       return [a1, a2, a3];
}

export function detM1([a]) {
       return a;
}

export function detM2([a11, a12, a21, a22]) {
       return a11 * a22 - a21 * a12;
}

export function detM3([a11, a12, a13, a21, a22, a23, a31, a32, a33]) {
       let det = 0;
       if (a31 !== 0) {
              det += a31 * detM2([a12, a13, a22, a23]);
       }
       if (a32 !== 0) {
              det -= a32 * detM2([a11, a13, a21, a23]);
       }
       if (a33 !== 0) {
              det += a33 * detM2([a11, a12, a21, a22]);
       }
       return det;
}

export function detM4([a11, a12, a13, a14, a21, a22, a23, a24, a31, a32, a33, a34, a41, a42, a43, a44]) {
       let det = 0;
       if (a41 !== 0) {
              det -= a41 * detM3([a12, a13, a14, a22, a23, a24, a32, a33, a34]);
       }
       if (a42 !== 0) {
              det += a42 * detM3([a11, a13, a14, a21, a23, a24, a31, a33, a34]);
       }
       if (a43 !== 0) {
              det -= a43 * detM3([a11, a12, a14, a21, a22, a24, a31, a32, a34]);
       }
       if (a44 !== 0) {
              det += a44 * detM3([a11, a12, a13, a21, a22, a23, a31, a32, a33]);
       }
       return det;
}

export function invertM1(m) {
       const [ a ] = m;
       
       // compute determinant

       /* const det11 = 1; */
       const det = a /* det11 */;
       
       if (det === 0) {
              return null;
       }

       // implicitly: construct the cofactor matrix

       /*const coM = [ +det11 ];*/
       
       // implicitly: transpose the cofactor matrix to get the adjugate

       /*const adjM = [ +det11 ];*/

       // explicitly: perform both steps and multiply simultaneously

       const ted = 1/det;

       const invM = [ ted /* +det11 === 1 */ ]; /* === [ 1/a ] */
       
       return invM;
}

export function invertM2(m) {
       const [a11, a12, a21, a22 ] = m;
       
       // compute submatrix determinants nescessary for the overall determinant
       
       const det21 = a12;
       const det22 = a11;
       
       const det = -a21 * det21 + a22 * det22;
       if (det === 0) {
              return null;
       }
       
       // compute rest of submatrix determinants
       
       const det11 = a22;
       const det12 = a21;

       // implicitly: construct the cofactor matrix

       /*const coM = [ +det11, -det12,
                     -det21, +det22, ];*/
       
       // implicitly: transpose the cofactor matrix to get the adjugate

       /*const adjM = [ +det11, -det21,
                     -det12, +det22, ];*/

       // explicitly: perform both steps and multiply simultaneously

       const ted = 1/det;

       const invM = [ ted * +det11, ted * -det21,
                      ted * -det12, ted * +det22, ];
       
       return invM;
}

export function invertM3(m) {
       const [a11, a12, a13, a21, a22, a23, a31, a32, a33 ] = m;
       
       // compute submatrix determinants nescessary for the overall determinant
       
       const det31 = detM2([a12, a13, a22, a23 ]);
       const det32 = detM2([a11, a13, a21, a23 ]);
       const det33 = detM2([a11, a12, a21, a22 ]);
       const det = a31 * det31 - a32 * det32 + a33 * det33;
       
       if (det === 0) {
              return null;
       }
       
       // compute rest of submatrix determinants
       
       const det21 = detM2([a12, a13, a32, a33]);
       const det22 = detM2([a11, a13, a31, a33]);
       const det23 = detM2([a11, a12, a31, a32]);
       
       const det11 = detM2([a22, a23, a32, a33]);
       const det12 = detM2([a21, a23, a31, a33]);
       const det13 = detM2([a21, a22, a31, a32]);

       // implicitly: construct the cofactor matrix

       /*const coM = [ +det11, -det12, +det13,
                     -det21, +det22, -det23,
                     +det31, -det32, +det33, ];*/
       
       // implicitly: transpose the cofactor matrix to get the adjugate

       /*const adjM = [ +det11, -det21, +det31,
                     -det12, +det22, -det32,
                     +det13, -det23, +det33, ];*/

       // explicitly: perform both steps and multiply simultaneously

       const ted = 1/det;

       const invM = [ ted * +det11, ted * -det21, ted * +det31,
                      ted * -det12, ted * +det22, ted * -det32,
                      ted * +det13, ted * -det23, ted * +det33, ];
       
       return invM;
}

export function invertM4(m) {
       const [a11, a12, a13, a14, a21, a22, a23, a24, a31, a32, a33, a34, a41, a42, a43, a44] = m;
       
       // compute submatrix determinants nescessary for the overall determinant
       
       const det41 = detM3([a12, a13, a14, a22, a23, a24, a32, a33, a34]);
       const det42 = detM3([a11, a13, a14, a21, a23, a24, a31, a33, a34]);
       const det43 = detM3([a11, a12, a14, a21, a22, a24, a31, a32, a34]);
       const det44 = detM3([a11, a12, a13, a21, a22, a23, a31, a32, a33]);
       const det = -a41 * det41 + a42 * det42 - a43 * det43 + a44 * det44;
       
       if (det === 0) {
              return null;
       }
       
       // compute rest of submatrix determinants
       
       const det31 = detM3([a12, a13, a14, a22, a23, a24, a42, a43, a44]);
       const det32 = detM3([a11, a13, a14, a21, a23, a24, a41, a43, a44]);
       const det33 = detM3([a11, a12, a14, a21, a22, a24, a41, a42, a44]);
       const det34 = detM3([a11, a12, a13, a21, a22, a23, a41, a42, a43]);
       
       const det21 = detM3([a12, a13, a14, a32, a33, a34, a42, a43, a44]);
       const det22 = detM3([a11, a13, a14, a31, a33, a34, a41, a43, a44]);
       const det23 = detM3([a11, a12, a14, a31, a32, a34, a41, a42, a44]);
       const det24 = detM3([a11, a12, a13, a31, a32, a33, a41, a42, a43]);
       
       const det11 = detM3([a22, a23, a24, a32, a33, a34, a42, a43, a44]);
       const det12 = detM3([a21, a23, a24, a31, a33, a34, a41, a43, a44]);
       const det13 = detM3([a21, a22, a24, a31, a32, a34, a41, a42, a44]);
       const det14 = detM3([a21, a22, a23, a31, a32, a33, a41, a42, a43]);

       // implicitly: construct the cofactor matrix

       /*const coM = [ +det11, -det12, +det13, -det14,
                     -det21, +det22, -det23, +det24,
                     +det31, -det32, +det33, -det34,
                     -det41, +det42, -det43, +det44 ];*/
       
       // implicitly: transpose the cofactor matrix to get the adjugate

       /*const adjM = [ +det11, -det21, +det31, -det41,
                     -det12, +det22, -det32, +det42,
                     +det13, -det23, +det33, -det43,
                     -det14, +det24, -det34, +det44 ];*/

       // explicitly: perform both steps and multiply simultaneously

       const ted = 1/det;

       const invM = [ ted * +det11, ted * -det21, ted * +det31, ted * -det41,
                      ted * -det12, ted * +det22, ted * -det32, ted * +det42,
                      ted * +det13, ted * -det23, ted * +det33, ted * -det43,
                      ted * -det14, ted * +det24, ted * -det34, ted * +det44 ];
       
       return invM;
}