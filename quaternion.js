import { 
       strV3, addV3, dotV3, scaleV3, crossV3, negV3, normSqV3,
} from "./linalg.js";

export function strQ([s, v]) {
       return `[${s}, ${strV3(v)}]`;
}

export function addQ([s, v], [t, w]) {
       return [s + t, addV3(v, w)];
}

export function multQ([s, v], [t, w]) {
       return [s * t - dotV3(v, w), addV3(addV3(scaleV3(s, w), scaleV3(t, v)), crossV3(v, w))]; 
}

export function reciprocalQ([s, v]) {
       const divisor = s * s + normSqV3(v);
       if (divisor === 0) {
              return null;
       }
       const reciprocal = 1 / divisor;
       return [reciprocal * s, scaleV3(reciprocal, v)];
}

export function conjQ([s, v]) {
       return [s, negV3(v)];
}

export function pureQuaternionForVector(v) {
       return [0, v];
}

export function rotationQuaternionAboutAxis(angle, axis) {
       const halfAngle = angle / 2;
       const cosHalfAngle = Math.cos(halfAngle);
       const sinHalfAngle = Math.sin(halfAngle);
       const scaledAxis = scaleV3(sinHalfAngle, axis);
       return [cosHalfAngle, scaledAxis];
}

export function rotationMatrixForQuaternion([r, [i, j, k]]) {
       const ii = i * i;
       const jj = j * j;
       const kk = k * k;
       
       const ij = i * j;
       const ir = i * r;
       const ik = i * k;
       
       const jr = j * r;
       const jk = j * k;

       const kr = k * r;
       
       return [
              1 - 2*(jj + kk), 2*(ij - kr), 2*(ik + jr),
              2 * (ij + kr), 1 - 2 * (ii + kk), 2 * (jk - ir),
              2 * (ik - jr), 2 * (jk + ir), 1 - 2 * (ii + jj), 
       ];
}



