import {
	LimbicSystem,
	BigNaturalSystem,
} from "./realarbitrary.js";

export function test(report) {
	const limbicSystem = new LimbicSystem(4);
	const bigNatural = new BigNaturalSystem(limbicSystem);
	const outputLine = report.outputLine;
	
    report.startSection("create", "Creation", "c23258300813cfa54ee388be1396a48cd73702f294a910a291f948fffd7e76fd");
    testCreate(bigNatural, outputLine);
    report.endSection("create");

	report.startSection("add", "Addition", "f04db1a23093b2d736820ff9a8ce1922580696244e63694b186f0a76ebcdfb17");
    testAdd(bigNatural, outputLine);
    report.endSection("add");

	report.startSection("subtract", "Subtraction", "e72eaa5c18082e225d04fb2cb8236ea2884c027c97f1571c403d007e6ed9d5bb");
    testSubtract(bigNatural, outputLine);
    report.endSection("subtract");

	report.startSection("multiply", "Multiplication", "05d672ee2d6d51acc4da0fd8a072c824e852d0b88f9bd47405be02791f893fae");
    testMultiply(bigNatural, outputLine);
    report.endSection("multiply");

	report.startSection("divide", "Division", "945810a76824a61c7caa84cd7eb24a10923150e5209744139d993fa6341ca197");
    testDivide(bigNatural, outputLine);
    report.endSection("divide");
	
	report.expandPath("/divide");
}

function testCreate(bigNatural, outputLine) {
	const a = bigNatural.fromSmallNumber(582);
	outputLine(a.toSmallNumber());
	outputLine(a.toBinaryString());
	outputLine(a.toHexadecimalString());
}

function testAdd(bigNatural, outputLine) {
	const a = bigNatural.fromSmallNumber(582);
	const b = bigNatural.fromSmallNumber(1034);
	const c = bigNatural.fromZero();
	bigNatural.add(a, b, c);
	outputLine(`${a.toSmallNumber()} + ${b.toSmallNumber()} === ${c.toSmallNumber()}`);
}

function testSubtract(bigNatural, outputLine) {
	const a = bigNatural.fromSmallNumber(582);
	const b = bigNatural.fromSmallNumber(1034);
	const c = bigNatural.fromZero();
	bigNatural.subtract(b, a, c);
	outputLine(`${b.toSmallNumber()} - ${a.toSmallNumber()} === ${c.toSmallNumber()}`);
}

function testMultiply(bigNatural, outputLine) {
	const a = bigNatural.fromSmallNumber(582);
	const b = bigNatural.fromSmallNumber(1034);
	const c = bigNatural.fromZero();
	bigNatural.multiply(a, b, c);
	outputLine(`${b.toSmallNumber()} * ${a.toSmallNumber()} === ${c.toSmallNumber()}`);
}


function testDivide(bigNatural, outputLine) {
	const a = bigNatural.fromSmallNumber(2034);
	const b = bigNatural.fromSmallNumber(582);
	const aa = a.clone();
	const c = bigNatural.fromZero();
	bigNatural.divide(aa, b, c);
	outputLine(`${a.toSmallNumber()} / ${b.toSmallNumber()} => ${c.toSmallNumber()} ${aa.toSmallNumber()} ${b.toSmallNumber()}`);
}