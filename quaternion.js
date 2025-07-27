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

export function identityQuaternion() {
       return [0, 0, 0, 1];
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

       console.log("(A2) b1 = 2 * (ij - kr): ", b1, 2 * (i * j - k * r));
       console.log("(A4) a2 = 2 * (ij + kr): ", a2,  2 * (i * j + k * r));
       console.log("     4kr = a2 - b1: ", 4 * k * r, a2 - b1);
       console.log("(F1) k = (a2 - b1) / 4r: ", k, (a2 - b1) / (4 * r));
       console.log("(F2) j = (a3 - c1) / 4r: ", j, (c1 - a3) / (4 * r));
       console.log("(F3) i = (b3 - c2) / 4r : ", i, (b3 - c2) / (4 * r));

       console.log("(...) b1 = 2*( ((b3 - c2) / 4r) * ((c1 - a3) / 4r) - ((a2 - b1) / 4r) * r)",
                   b1, 2*( ((b3 - c2) / (4*r)) * ((c1 - a3) / (4*r)) - ((a2 - b1) / (4*r)) * r));
       console.log("      ((a2 - b1) / (4*r)) * r = (a2 - b1)/4", ((a2 - b1) / (4*r)) * r, (a2 - b1)/4);
       console.log("      ((b3 - c2) / (4*r)) * ((c1 - a3) / (4*r)) = ((b3 - c2)*(c1 - a3))/(16*r^2)",
                   ((b3 - c2) / (4*r)) * ((c1 - a3) / (4*r)), ((b3 - c2)*(c1 - a3))/(16 * r * r))
       console.log("(...) b1 = 2*(((b3 - c2)*(c1 - a3))/16r^2 - (a2 - b1)/4)",
                  b1, 2*(((b3 - c2)*(c1 - a3))/(16*r*r) - (a2 - b1)/4));
       console.log("(...) b1 = (b3 - c2)*(c1 - a3)/8r^2 - (a2 - b1)/2", 
                  b1, (b3 - c2)*(c1 - a3)/(8 * r * r) - (a2 - b1)/2);
       console.log("(...) (b1+a2)/2 = (b3 - c2)*(c1 - a3)/4r^2: ", 
                   (b1+a2)/2, (b3 - c2)*(c1 - a3)/(4 * r * r));
       console.log("(...) b1+a2 = (b3 - c2)*(c1 - a3)/(4*r^2): ", 
                   b1+a2, (b3 - c2)*(c1 - a3)/(4*r*r));
       console.log("(...) r = sqrt((b3 - c2)*(c1 - a3)/4(b1+a2)): ", 
                   r, Math.sqrt(((b3 - c2)*(c1 - a3))/(4*(b1+a2))));

       console.log("(alt) a2 = 2*( ((b3 - c2) / 4r) * ((c1 - a3) / 4r) + ((a2 - b1) / 4r) * r)",
                  a2, 2*( ((b3 - c2) / (4 * r)) * ((c1 - a3) / (4 * r)) + ((a2 - b1) / (4 * r)) * r));
       console.log("(alt) a2 = 2*((b3 - c2)*(c1 - a3)/16r^2 + (a2 - b1)/4)",
                   a2, 2*((b3 - c2)*(c1 - a3)/(16 * r * r) + (a2 - b1)/4));
       console.log("(alt) a2 = (b3 - c2)*(c1 - a3)/8r^2 + (a2 - b1)/2",
                  a2, (b3 - c2)*(c1 - a3)/(8 * r * r) + (a2 - b1)/2);
       console.log("(alt) (a2+b1)/2 = (b3 - c2)*(c1 - a3)/8r^2",
                  (a2+b1)/2, (b3 - c2)*(c1 - a3)/(8*r*r))
       console.log("(alt) a2+b1 = (b3 - c2)*(c1 - a3)/4r^2", 
                  a2+b1, (b3 - c2)*(c1 - a3)/(4 * r * r))
       console.log("(alt) r = sqrt(((b3 - c2)*(c1 - a3))/4(a2+b1)): ", 
                   r, Math.sqrt(((b3 - c2)*(c1 - a3))/(4 * (a2+b1))));

       console.log("(iii) c1 = 2 * (((b3 - c2) / 4r) * ((a2 - b1) / 4r) + ((c1 - a3) / 4r) * r)",
                   c1, 2 * (((b3 - c2) / (4 * r)) * ((a2 - b1) / (4 * r)) + ((c1 - a3) / (4 * r)) * r))
       console.log(((b3 - c2) * (a2 - b1))/(4*(c1 + a3)));
       console.log("(iii) r = sqrt(((b3 - c2) * (a2 - b1))/4(c1 + a3))",
                  r, Math.sqrt(((b3 - c2) * (a2 - b1))/(4*(c1 + a3))))

       console.log("(iv) r = sqrt(((b3 - c2) * (a2 - b1))/4(b3 + c2))",
                  r, Math.sqrt(((b3 - c2) * (a2 - b1))/(4 * (b3 + c2))));

       console.log("(v) k = sqrt(((c1 + a3) * (b3 + c2))/4(a2 + b1))",
                   k, Math.sqrt(((c1 + a3) * (b3 + c2))/(4 * (a2 + b1))));
       
       return m;
}

export function affineRotationMatrixForQuaternion([i, j, k, r]) {
       // TODO
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

//export function quaternionForRotationMatrix([a1, b1, c1, a2, b2, c2, a3, b3, c3]) {
       /* We have:
        *
        * a1 = 1 - 2 * (j^2 + k^2)   (A1)
        * b1 = 2 * (ij - kr)         (A2)
        * c1 = 2 * (ik + jr)         (A3)
        * a2 = 2 * (ij + kr),        (A4)
        * b2 = 1 - 2 * (i^2 + k^2)   (A5)
        * c2 = 2 * (jk - ir)         (A6)
        * a3 = 2 * (ik - jr)         (A7)
        * b3 = 2 * (jk + ir)         (A8)
        * c3 = 1 - 2 * (i^2 + j^2)   (A9)
        *
        * In addition we have that all three rotated axes are unit length: 
        *              a1^2 + a2^2 + a3^2 = 1     (B1)      
        *              b1^2 + b2^2 + b3^2 = 1     (B2)
        *              c1^2 + c2^2 + c3^2 = 1     (B3)
        *              
        * Each pair of rotated axes is orthogonal and so has dot-product zero:
        *              a1*c1 + a2*c2 + a3*c3 = 0  (C1)
        *              b1*c1 + b2*c2 + b3*c3 = 0  (C2)
        *              a1*b1 + a2*b2 + a3*b3 = 0  (C4)
        *
        * Each pair of rotated axes produces the third by means of a cross product, i.e.:
        *              c1 = a2*b3 - a3*b2,        (D1)
        *              c2 = a3*b1 - a1*b3,        (D2)
        *              c3 = a1*b2 - a2*b1,        (D3)
        *
        * And similarly a = b x c and b = c x a.
        *
        * Finally:
        *              i^2 + j^2 + k^2 + r^2 = 1  (E1)
        *
        * From (A2) + (A4):
        *              4kr = a2 - b1
        *              k = (a2 - b1) / 4r,        (F1)
        *
        * From (A3) + (A7):
        *              4jr = c1 - a3
        *              j = (c1 - a3) / 4r         (F2)
        *
        * From (A6) + (A8):
        *              4ir = b3 - c2
        *              i = (b3 - c2) / 4r         (F3)
        *
        * Substitute (A2) using (F1..3)
        *              b1 = 2*(ij - kr)
        *              b1 = 2*( ((b3 - c2) / 4r) * ((c1 - a3) / 4r) - ((a2 - b1) / 4r) * r)
        *              b1 = 2*((b3 - c2)*(c1 - a3)/16r^2 - (a2 - b1)/4)
        *              b1 = (b3 - c2)*(c1 - a3)/8r^2 - (a2 - b1)/2
        *       (b1+a2)/2 = (b3 - c2)*(c1 - a3)/8r^2
        *           b1+a2 = (b3 - c2)*(c1 - a3)/4r^2
        *             r^2 = ((b3 - c2)*(c1 - a3))/4(b1+a2)
        *               r = sqrt(((b3 - c2)*(c1 - a3))/4(b1+a2))
        *
        * Substitute (A4) using (F1..3)
        *              a2 = 2*(ij + kr)
        *              a2 = 2*( ((b3 - c2) / 4r) * ((c1 - a3) / 4r) + ((a2 - b1) / 4r) * r)
        *              a2 = 2*((b3 - c2)*(c1 - a3)/16r^2 + (a2 - b1)/4)
        *              a2 = (b3 - c2)*(c1 - a3)/8r^2 + (a2 - b1)/2
        *       (a2+b1)/2 = (b3 - c2)*(c1 - a3)/8r^2
        *           a2+b1 = (b3 - c2)*(c1 - a3)/4r^2
        *             r^2 = ((b3 - c2)*(c1 - a3))/4(a2+b1)
        *               r = sqrt(((b3 - c2)*(c1 - a3))/4(a2+b1))
        *
        * Substitute (A3) using (F1..3)
        *              c1 = 2 * (ik + jr)
        *              c1 = 2 * (((b3 - c2) / 4r) * ((a2 - b1) / 4r) + ((c1 - a3) / 4r) * r)
        *              c2 = 2 * ((b3 - c2) * (a2 - b1)/16r^2 + (c1 - a3) / 4)
        *               r = sqrt(((b3 - c2) * (a2 - b1))/4(c1 + a3))
        * 
        * * Substitute (A8) using (F1..3)
        *              b3 = 2 * (jk + ir)
        *              b3 = 2 * (((c1 - a3) / 4r) * ((a2 - b1) / 4r) + ((b3 - c2) / 4r) * r)
        *              b3 = 2 * ((c1 - a3) * (a2 - b1)/16r^2 + (b3 - c2) / 4)
        *               r = sqrt(((b3 - c2) * (a2 - b1))/4(b3 + c2))
        * 
        * * From (A2) + (A4):
        *              4kr = a2 - b1
        *              r = (a2 - b1) / 4k,        (G1)
        *
        * From (A3) + (A7):
        *              4ik = c1 + a3
        *              i = (c1 + a3) / 4k         (G2)
        *
        * From (A6) + (A8):
        *              4jk = b3 + c2
        *              j = (b3 + c2) / 4k         (G3)
        *
        * Substitute (A2) using (G1..3)
        *              b1 = 2 * (ij - kr))
        *              b1 = 2 * (((c1 + a3) / 4k) * ((b3 + c2) / 4k) - k * ((a2 - b1) / 4k))
        *              k = sqrt(((c1 + a3) * (b3 + c2))/4(a2 + b1))
        *
        * Or we use spatial reasoning:
        *   the quaternion that brings the three rotated axes to the world axes
        *   can always be written as the product of two rotation quaternions, the
        *   first will align at least one axis the second will be guaranteed to 
        *   align all three.
        */
//}

