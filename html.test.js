import { sha256 } from "./sha256.js";

export class TestParagraph {

    constructor(parentSection, idx) {
        this.parentSection = parentSection;
        this.idx = idx;
        this.contentElement = document.createElement("div");
        this.hashHex = "0000000000000000000000000000000000000000000000000000000000000000";
        this.finished = false;
        this.passed = true;
    }
    
    reportFinished() {
        if (this.finished) {
            throw new Error("can't finish paragraph more than once");
        }
        this.finished = true;
        this.parentSection.paragraphIsFinished(this);
    }
    
}

export class LinesTestParagraph extends TestParagraph {

    constructor(parentSection, idx) {
        super(parentSection, idx);
        this.hasher = sha256();
        this.committed = false;
    }

    addLine(str, noHash) {
        if (this.finished) {
            throw new Error("can't add line to finished paragraph");
        }
        if (!noHash) {
            this.hasher.add(str);
        }
        const preLine = document.createElement("pre")
        preLine.innerText = str;
        if (noHash) {
            preLine.style.color = "blue";
        }
        this.contentElement.appendChild(preLine);
    }

    commit() {
        if (this.committed) {
            throw new Error("can't commit paragraph more than once");
        }
        this.committed = true;
        this.reportIfFinished();
    }

    reportIfFinished() {
        if (!this.committed) {
            return;
        }
        this.hashHex = this.hasher.digest().hex();
        this.reportFinished();
    }
}

export class ImageTestParagraph extends TestParagraph {
    
    constructor(parentSection, idx, url, noHash) {
        super(parentSection, idx);
        const imgElement = document.createElement("img");
        this.imgElement = imgElement;
        this.hashHasFinished = false || noHash;
        this.imageHashFinished = false;
        if (!noHash) {
            fetch(url).then(r => r.blob().arrayBuffer().then((arrayBuffer) => {
                const hasher = sha256();
                const uint8View = new Uint8Array(arrayBuffer);
                hasher.add(uint8View);
                this.hashHex = hasher.digest().hex();
                this.hashHasFinished = true;
                this.reportIfFinished();            
            }));
        }
        imgElement.onload = () => {
            this.imageHashFinished = true;
            this.reportIfFinished();
        }
        imgElement.src = url;
        this.contentElement.appendChild(imgElement);
    }

    reportIfFinished() {
        if (this.imageHashFinished && this.hashHasFinished) {
            this.reportFinished();
        }
    }
}

export class SubSectionTestParagraph extends TestParagraph {
    
    constructor(parentSection, idx, subSection) {
        super(parentSection, idx);
        this.subSection = subSection;
        subSection.addFinishedHandler(() => {
            this.passed = subSection.passed;
            this.reportFinished();
        });
        this.contentElement.appendChild(subSection.headerElement);
        this.contentElement.appendChild(subSection.contentElement);
    }
}

export class TestSection {

    constructor(parentSection, name, title, expectedHashHex) {
        this.parentSection = parentSection;
        this.name = name;
        this.title = title;
        this.expectedHashHex = expectedHashHex ?? null;
        
        this.nameToSubsection = new Map();

        const level = parentSection === null ? 1 : parentSection.level + 1;
        this.level = level;
        const headerTag =
            (level <= 1) ? "h1" :
            (level === 2) ? "h2" :
            (level === 3) ? "h3" :
            "h4";

        const headerElement = document.createElement(headerTag);
        const contentElement = document.createElement("section");
        
        this.headerElement = headerElement;
        this.contentElement = contentElement;

        const triangleSpan = document.createElement("span");
        triangleSpan.innerHTML = "&#9656;";
        
        const titleSpan = document.createElement("span");
        titleSpan.innerText = title;

        headerElement.appendChild(triangleSpan);
        headerElement.appendChild(titleSpan);
        
        this.expanded = false;
        
        this.paragraphEntries = [];
        this.numberOfUnfinishedParagraphs = 0;
        
        this.currLineParagraph = null;
        
        this.committed = false;
        this.finished = false;
        this.passed = true;
        
        this.finishedHandlers = [];
    }

    _addParagraph(paragraph) {
        this.paragraphEntries.push({
            paragraph: paragraph,
            finished: false,
        });
        this.numberOfUnfinishedParagraphs++;
        this.contentElement.appendChild(paragraph.contentElement);
        return paragraph;
    }
    
    addImage(url, noHash) {
        const imageParagraph = this._addParagraph(
            new ImageTestParagraph(this, this.paragraphEntries.length, url, noHash));
    }

    addLine(str, noHash) {
        if (this.currLineParagraph === null) {
             const lineParagraph = this._addParagraph(
                 new LinesTestParagraph(this, this.paragraphEntries.length));
            this.currLineParagraph = lineParagraph;
        }
        this.currLineParagraph.addLine(str, noHash);
    }

    createSubSection(name, title, expectedHashHex) {
        if (this.nameToSubsection.has(name)) {
            throw new Error(`existing subsection name: ${name}`);
        }
        const subSection = new TestSection(this, name, title, expectedHashHex);
        this.nameToSubsection.set(name, subSection);
        if (this.currLineParagraph !== null) {
            this.currLineParagraph.commit();
            this.currLineParagraph = null;
        }
        const subSectionParagraph = this._addParagraph(
            new SubSectionTestParagraph(this, this.paragraphEntries.length, subSection));
        return subSection;
    }
    
    commit() {
        if (this.committed) {
            throw new Error("can't commit section more than once");
        }
        this.committed = true;
        this.finishIfPossible();    
    }

    paragraphIsFinished(paragraph) {
        const entry = this.paragraphEntries[paragraph.idx];
        if (entry.finished) {
            throw new Error("invariant violation: paragraph reported as finished more than once");
        }
        entry.finished = true;
        this.numberOfUnfinishedParagraphs--;
        if (!paragraph.passed) {
            this.passed = false;
        }
        this.finishIfPossible();
    }

    finishIfPossible() {
        if (this.committed &&
            this.numberOfUnfinishedParagraphs === 0) {
            this.finish();
        }
    }
    
    finish() {
        if (this.finished) {
            throw new Error("can't finish section more than once");
        }
        this.finished = true;
        const hasher = sha256();
        for (const { paragraph } of this.paragraphEntries) {
            hasher.add(paragraph.hashHex);
        }
        const hashHex = hasher.digest().hex();
        if (this.expectedHashHex !== null && hashHex !== this.expectedHashHex) {
            this.passed = false;
        }
        for (const finishedHandler of this.finishedHandlers) {
            finishedHandler(this);
        }
    }

    addFinishedHandler(finishedHandler) {
        this.finishedHandlers.push(finishedHandler);
    }
    
    setExpanded(expanded) {
        if (expanded) {
            this.expand();
        } else {
            this.collapse();
        }
    }
    
    expand() {
        if (this.expanded) {
            return;
        }
        this.triangleSpan.innerHTML = "&#9662;";
        this.contentElement.style.display = "block";
        this.expanded = true;
    }

    collapse() {
        if (!this.expanded) {
            return;
        }
        this.triangleSpan.innerHTML = "&#9656;";
        this.contentElement.style.display = "none";
        this.expanded = false;
    }
}

export class TestReport {

    constructor(mainEnclosing, title, expectedHashHex) {
        const mainSection = new TestSection(null, "", title, expectedHashHex);
        this.currSection = mainSection;
        this.outputLine = (str) => {
            this.logLine(str);            
        };
        mainEnclosing.appendChild(mainSection.contentElement);
    }
    
    startSection(name, title, expectedHashHex) {
        this.currSection = this.currSection.createSubSection(name, title, expectedHashHex);
    }

    endSection(name) {
        if (this.currSection.name !== name) {
            throw new Error(`unmatched endSection request: asked for name: ${name}: actual open section name was: ${this.currSection.name}`);
        }
        this.currSection.commit();
        this.currSection = this.currSection.parentSection;
    }
    
    logLine(str, noHash) {
        this.currSection.addLine(str, noHash);
    }
    
    logImage(url, hash) {
        if (hash === undefined) {
            hash = false;
        }
        this.currSection.addImage(url, !hash);
    }

    createCanvas(width, height) {
        const canvasElement = document.createElement("canvas");
        canvasElement.width = width;
        canvasElement.height = height;
        return canvasElement;
    }
}

