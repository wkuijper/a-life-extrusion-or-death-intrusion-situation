import * as THREE from "./three.module.js";

import { 
    scaleV1, subtractV1, addV1, strV1,
    scaleV2, subtractV2, addV2, strV2,
    scaleV3, subtractV3, addV3, strV3,
    scaleV4, subtractV4, addV4, strV4, 

    identityM1, multM1V1, strM1,
    identityM2, multM2V2, strM2,
    identityM3, multM3V3, strM3,
    identityM4, multM4V4, strM4,

    augmentV1,
    augmentV2,
    augmentV3,
    
    deaugmentV2,
    deaugmentV3,
    deaugmentV4,

    composeAffineM1V1,
    composeAffineM2V2,
    composeAffineM3V3,
    
    decomposeAffineM2,
    decomposeAffineM3,
    decomposeAffineM4,

    detM1,
    detM2,
    detM3,
    detM4,

    invertM1,
    invertM2,
    invertM3,
    invertM4,

    multM1,
    multM2,
    multM3,
    multM4,
} from "./linalg.js";
    
export function test(report) {
    report.startSection("addV", "Vector Addition", "4e8a6e7f8be361e6ed79623fe0389995ecc0a0f70a61657a70239f98c7d8618a");
    testAdd(report);
    report.endSection("addV");

    report.startSection("subtractV", "Vector Subtraction", "31da9212d7123ee69af59e2dc7d6a346007ab6ae8963c2c1dbc14247f84cd042");
    testSubtract(report);
    report.endSection("subtractV");
    
    report.startSection("scaleV", "Vector Scaling", "1ed025b3501b4f52ed6fbd4fe547a137e7eca1c2cce1ca372a454f32dd3bcb7a");
    testScale(report);
    report.endSection("scaleV");

    report.startSection("multMV", "Matrix Vector Multiplication", "02008bcaed1c817040399865117142c103baf8cbb265287a2a44e3a4878c1eb9");
    testMultMV(report);
    report.endSection("multMV");

    report.startSection("affine", "Affine Transformations", "3cfabd2152b409a48975303708defc52f925cb7372e60bc580b3e9820118b39a");
    testAffine(report);
    report.endSection("affine");

    report.startSection("det", "Matrix Determinants", "ba1f27eaabebc50f957dc4c0be37b3363dbd71f89f54d38e0be040b62fef179f");
    testDetM(report);
    report.endSection("det");

    report.startSection("inv", "Matrix Inverses", "86ece71323aabb19fc7ecfa11bda30763ccdc61b0cdc5e5934ff975ce7224b9e");
    testInvM(report);
    report.endSection("inv");
    
	report.expandPath("/inv/arbitrary");
}

export function testAdd(report) {
    const outputLine = report.outputLine;
    const prefix = "";

    const a = [1];
    const b = [2];
    const c = addV1(a, b);

    outputLine(`${strV1(a)} + ${strV1(b)} = ${strV1(c)}`);
    
    const d = [1, -5];
    const e = [-3, 2];
    const f = addV2(d, e);

    outputLine(`${strV2(d)} + ${strV2(e)} = ${strV2(f)}`);
    
    const g = [1, -5, 2];
    const h = [-3, 2, 9];
    const i = addV3(g, h);

    outputLine(`${strV3(g)} + ${strV3(h)} = ${strV3(i)}`);
    
    const j = [1, -5, 2, -2];
    const k = [-3, 2, 9, -8];
    const l = addV4(j, k);

    outputLine(`${strV4(j)} + ${strV4(k)} = ${strV4(l)}`); 
}

export function testSubtract(report) {
    const outputLine = report.outputLine;
    const prefix = "";

    const a = [1];
    const b = [2];
    const c = subtractV1(a, b);

    outputLine(`${strV1(a)} - ${strV1(b)} = ${strV1(c)}`);
    
    const d = [1, -5];
    const e = [-3, 2];
    const f = subtractV2(d, e);

    outputLine(`${strV2(d)} - ${strV2(e)} = ${strV2(f)}`);
    
    const g = [1, -5, 2];
    const h = [-3, 2, 9];
    const i = subtractV3(g, h);

    outputLine(`${strV3(g)} - ${strV3(h)} = ${strV3(i)}`);
    
    const j = [1, -5, 2, -2];
    const k = [-3, 2, 9, -8];
    const l = subtractV4(j, k);

    outputLine(`${strV4(j)} - ${strV4(k)} = ${strV4(l)}`); 
}

export function testScale(report) {
    const outputLine = report.outputLine;
    const prefix = "";

    const a = [1];
    const s = 2;
    const b = scaleV1(s, a);

    outputLine(`${s} * ${strV1(a)} = ${strV1(b)}`);
    
    const c = [1, -5];
    const t = -3;
    const d = scaleV2(t, c);

    outputLine(`${t} * ${strV2(c)} = ${strV2(d)}`);
    
    const e = [1, -5, 2];
    const u = 9;
    const f = scaleV3(u, e);

    outputLine(`${u} * ${strV3(e)} = ${strV3(f)}`);
    
    const g = [1, -5, 2, -2];
    const v = -8;
    const h = scaleV4(v, g);

    outputLine(`${v} * ${strV4(g)} = ${strV4(h)}`); 
}

export function testMultMV(report) {

    report.startSection("identityM", "Identity Matrices", "8cbe4eb506f9c40aa836fd617845590d7f54a205f2221c5cb07948ef968f4313");
    testMultIdentityMV(report);
    report.endSection("identityM");

    report.startSection("arbitraryM", "Arbitrary Matrices", "f19b13540d112271d05cf5b9f4c6b136b3f0b1451c1067bde68fccfabc640a85");
    testMultArbitraryMV(report);
    report.endSection("arbitraryM");

}    

export function testMultIdentityMV(report) {
    
    const outputLine = report.outputLine;
    const prefix = "";

    const m = identityM1();
    const a = [4];
    const b = multM1V1(m, a);

    outputLine(`${strM1(m)} * ${strV1(a)} = ${strV1(b)}`);
    
    const n = identityM2();
    const c = [7, -2];
    const d = multM2V2(n, c);

    outputLine(`${strM2(n)} * ${strV2(c)} = ${strV2(d)}`);
    
    const o = identityM3();
    const e = [2, 8, -1];
    const f = multM3V3(o, e);

    outputLine(`${strM3(o)} * ${strV3(e)} = ${strV3(f)}`);
    
    const p = identityM4();
    const g = [12, 1228, -1.2, 5];
    const h = multM4V4(p, g);

    outputLine(`${strM4(p)} * ${strV4(g)} = ${strV4(h)}`);
}

export function testMultArbitraryMV(report) {
    
    const outputLine = report.outputLine;
    const prefix = "";

    const m = [-2.1];
    const a = [4];
    const b = multM1V1(m, a);

    outputLine(`${strM1(m)} * ${strV1(a)} = ${strV1(b)}`);
    
    const n = [4, 2, 0, 5];
    const c = [7, -2];
    const d = multM2V2(n, c);

    outputLine(`${strM2(n)} * ${strV2(c)} = ${strV2(d)}`);
    
    const o = [3, 2, 0, 0, 1, 5, 0, 1, 3 ];
    const e = [2, 8, -1];
    const f = multM3V3(o, e);

    outputLine(`${strM3(o)} * ${strV3(e)} = ${strV3(f)}`);
    
    const p = [8, 2, 0, 1,  0, 3, 7, 0,  0, 0, 5, 1,  1, 5, 2, 4];
    const g = [12, 2, -1, 5];
    const h = multM4V4(p, g);

    outputLine(`${strM4(p)} * ${strV4(g)} = ${strV4(h)}`);
}

export function testAffine(report) {

    report.startSection("augment", "Augment Vectors", "de96382dace5e01fbcbdf4bb1def385fa51cfcdee9f243188362577359778c8c");
    testAffineAugment(report);
    report.endSection("augment");

    report.startSection("deaugment", "Deaugment Vectors", "42d87f11c12c058eea6d3471996d718eee4023de6033aeac56759771a14bf821");
    testAffineDeaugment(report);
    report.endSection("deaugment");
    
    report.startSection("compose", "Compose Transformations", "fe810e861e413ecd6dc1277aa220dcc364632319d4c5b7f72dda0c783e020339");
    testAffineCompose(report);
    report.endSection("compose");
    
    report.startSection("decompose", "Decompose Transformations", "8316b2855d4ba95879646025fc94eb4e805839b15d49c8a05ddb9dada83dbef2");
    testAffineDecompose(report);
    report.endSection("decompose");
}

export function testAffineAugment(report) {
    
    const outputLine = report.outputLine;
    const prefix = "";

    const a = [9];
    const b = augmentV1(a);

    outputLine(`augment${strV1(a)} = ${strV2(b)}`);

    const c = [9, 8];
    const d = augmentV2(c);

    outputLine(`augment${strV2(c)} = ${strV3(d)}`);
    
    const e = [9, 8, 7];
    const f = augmentV3(e);

    outputLine(`augment${strV3(e)} = ${strV4(f)}`);
    
}

export function testAffineDeaugment(report) {
    
    const outputLine = report.outputLine;
    const prefix = "";

    const a = [9, 1];
    const b = deaugmentV2(a);

    outputLine(`deaugment${strV2(a)} = ${strV1(b)}`);

    const c = [9, 8, 1];
    const d = deaugmentV3(c);

    outputLine(`deaugment${strV3(c)} = ${strV2(d)}`);
    
    const e = [9, 8, 7, 1];
    const f = deaugmentV4(e);

    outputLine(`deaugment${strV4(e)} = ${strV3(f)}`);
    
}


export function testAffineCompose(report) {
    
    const outputLine = report.outputLine;
    const prefix = "";

    const a = [9];
    const m = [11];
    const mm = composeAffineM1V1(m, a);

    outputLine(`compose${strM1(m)}${strV1(a)} = ${strM2(mm)}`);

    const b = [9, 8];
    const n = [11, 12, 21, 22];
    const nn = composeAffineM2V2(n, b);

    outputLine(`compose${strM2(n)}${strV2(b)} = ${strM3(nn)}`);
    
    const c = [9, 8, 7];
    const o = [11, 12, 13, 21, 22, 23, 31, 32, 33];
    const oo = composeAffineM3V3(o, c);

    outputLine(`compose${strM3(o)}${strV3(c)} = ${strM4(oo)}`);
}

export function testAffineDecompose(report) {
    
    const outputLine = report.outputLine;
    const prefix = "";

    const mm = [11, 9, 0, 1];
    const [m, a] = decomposeAffineM2(mm);
    outputLine(`decompose${strM2(mm)} = ${strV1(a)}${strM1(m)}`);

    const nn = [11, 12, 9, 21, 22, 8, 0, 0, 1];
    const [n, b] = decomposeAffineM3(nn);
    outputLine(`decompose${strM3(nn)} = ${strV2(b)}${strM2(n)}`);
    
    const oo = [11, 12, 13, 9, 21, 22, 23, 8, 31, 32, 33, 7, 0, 0, 0, 1]
    const [o, c] = decomposeAffineM4(oo);
    outputLine(`decompose${strM4(oo)} = ${strV3(c)}${strM3(o)}`);
}

export function testDetM(report) {

    report.startSection("identity", "Identity Matrices", "6f75112143ad8383c3c3368d7b98b5bda50a3e0439a2343ec4347d07188f08e4");
    testDetIdentityM(report);
    report.endSection("identity");

    report.startSection("arbitrary", "Arbitrary Matrices", "d75978d75272f28fb7b343a35330f36f0eb50412e0a16553be28f4cbcfdc9358");
    testDetArbitraryM(report);
    report.endSection("arbitrary");

}

export function testDetIdentityM(report) {
    
    const outputLine = report.outputLine;
    const prefix = "";

    const m = identityM1();
    const s = detM1(m);

    outputLine(`det${strM1(m)} = ${s}`);

    
    const n = identityM2();
    const t = detM2(n);

    outputLine(`det${strM2(n)} = ${t}`);
    
    const o = identityM3();
    const u = detM3(o);

    outputLine(`det${strM3(o)} = ${u}`);
    
    const p = identityM4();
    const v = detM4(p);

    outputLine(`det${strM4(p)} = ${v}`);
}


export function testDetArbitraryM(report) {
    
    const outputLine = report.outputLine;
    const prefix = "";

    const m = [-2.1];
    const s = detM1(m);
    outputLine(`det${strM1(m)} = ${s}`);

    const n = [4, 2, 0, 5];
    const t = detM2(n);
    
    outputLine(`det${strM2(n)} = ${t}`);
    
    const o = [3, 2, 0, 0, 1, 5, 0, 1, 3 ];
    const oT = new THREE.Matrix3();
    oT.set(...o);    
    const u = detM3(o);
    const uT = oT.determinant();

    outputLine(`det${strM3(o)} = ${u} (${uT})`);

    const oP = [11, 12, 3, 14, 5, 16, 7, 18, 9];
    const oPT = new THREE.Matrix3();
    oPT.set(...oP);    
    const uP = detM3(oP);
    const uPT = oPT.determinant();

    outputLine(`det${strM3(oP)} = ${uP} (${uPT})`);
    
    const p = [8, 2, 0, 1,  0, 3, 7, 0,  0, 0, 5, 1,  1, 5, 2, 4];
    const pT = new THREE.Matrix4();
    pT.set(...p);    
    
    const v = detM4(p);
    const vT = pT.determinant();

    outputLine(`det${strM4(p)} = ${v} (${vT})`);
}


export function testInvM(report) {

    report.startSection("identity", "Identity Matrices", "02ac42af4639f87bb9ef91230476fbb8cca8318c4930d95d1bc58419194e904d");
    testInvIdentityM(report);
    report.endSection("identity");

    report.startSection("arbitrary", "Arbitrary Matrices", "0fbcf605cb5391f3264e3a01072a7dd2d7c7a8b956d8953b1f11df9bc90a40da");
    testInvArbitraryM(report);
    report.endSection("arbitrary");

}

export function testInvIdentityM(report) {
    
    const outputLine = report.outputLine;
    const prefix = "";

    const m = identityM1();
    const mm = invertM1(m);

    outputLine(`inv${strM1(m)} = ${strM1(mm)}`);

    
    const n = identityM2();
    const nn = invertM2(n);

    outputLine(`inv${strM2(n)} = ${strM2(nn)}`);
    
    const o = identityM3();
    const oo = invertM3(o);

    outputLine(`inv${strM3(o)} = ${strM3(oo)}`);
    
    const p = identityM4();
    const pp = invertM4(p);

    outputLine(`inv${strM4(p)} = ${strM4(pp)}`);
}


export function testInvArbitraryM(report) {
    
    const outputLine = report.outputLine;
    const prefix = "";

    const m = [-2.1];
    const mm = invertM1(m);
    outputLine(`inv${strM1(m)} = ${strM1(mm)}`);

    const mmm = invertM1(mm);
    outputLine(`inv${strM1(mm)} = ${strM1(mmm)}`);

    outputLine(`--`);
    
    const n = [4, 2, 0, 5];
    const nn = invertM2(n);    
    outputLine(`inv${strM2(n)} = ${strM2(nn)}`);

    const nnn = invertM2(nn);
    outputLine(`inv${strM2(nn)} = ${strM2(nnn)}`);

    const nXnn = multM2(n, nn);
    outputLine(`n * inv(n) = ${strM2(nXnn)}`);
    
    outputLine(`--`);
    
    const o = [3, 2, 0, 0, 1, 5, 0, 1, 3 ];
    const oT = new THREE.Matrix3();
    oT.set(...o);    
    const oo = invertM3(o);
    const ooT = oT.clone().invert();
    outputLine(`inv${strM3(o)} = ${strM3(oo)} (${[...ooT.transpose().elements]})`);

    const ooo = invertM3(oo);
    outputLine(`inv${strM3(oo)} = ${strM3(ooo)}`);

    const oXoo = multM3(o, oo);
    outputLine(`o * inv(o) = ${strM3(oXoo)}`);
    
    outputLine(`--`);
    
    const p = [8, 2, 0, 1,  0, 3, 7, 0,  0, 0, 5, 1,  1, 5, 2, 4];
    const pT = new THREE.Matrix4();
    pT.set(...p);    
    
    const pp = invertM4(p);
    const ppT = pT.clone().invert();

    outputLine(`inv${strM4(p)} =`);
    outputLine(`  ${strM4(pp)}`);
    outputLine(`  (${[...ppT.transpose().elements]})`);
    const ppp = invertM4(pp);
    outputLine(`inv(pp) = ${strM4(ppp)}`);

    const pXpp = multM4(p, pp);
    outputLine(`o * inv(o) = ${strM4(pXpp)}`);
}