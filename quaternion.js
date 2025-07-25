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
       return [
              1 - 2*(jj + kk), 2*(ij - kr), 2*(ik + jr),
              2 * (ij + kr), 1 - 2 * (ii + kk), 2 * (jk - ir),
              2 * (ik - jr), 2 * (jk + ir), 1 - 2 * (ii + jj), 
       ];
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


