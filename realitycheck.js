import { RealExpr } from "./realvalue.js";

function _isRationalForSure(realExpr) {
    if (realExpr instanceof NaturalNumberExpr) {
        return true;
    }
    if (realExpr.value.isPerfectForSure()) {
        return true;
    }
    if (realExpr instanceof UnaryOperationExpr) {
        ["-"].includes(realExpr.operatorStr);
        return 
            _isRationalForSure(realExpr.subExpr);
    }
    if (realExpr instanceof BinaryOperationExpr) {
        ["+", "-", "*", "/"].includes(realExpr.operatorStr);
        return 
            _isRationalForSure(realExpr.leftExpr)
            && _isRationalForSure(realExpr.rightExpr);
    }
}

class RationalCanonizer {

    applies(realExpr) {
        return _isForSureRational(realExpr);
    }

    canonize(realExpr) {
            
    }
}