import { sha256 } from "./sha256.js";

export class TestParagraph {

    constructor(parentSection, idx) {
        this.parentSection = parentSection;
        this.idx = idx;
        this.contentElement = document.createElement("div");
        this.hexHash = "";
        this.finished = false;
        this.passed = true;
    }
    
    reportFinished() {
        if (this.finished) {
            throw new Error("can't finish paragraph more than once");
        }
        this.finished = true;
        this.parent.paragraphIsFinished(this);
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
        this.hexHash = this.hasher.hex();
        reportFinished();
    }
}

export class ImageTestParagraph extends TestParagraph {
    
    constructor(parentSection, idx, imageBlob) {
        super(parentSection, idx);
        this.imgElement = document.createElement("img");
        this.hashHasFinished = false;
        this.imageHashFinished = false;
        imageBlob.arrayBuffer().then((arrayBuffer) => {
            const hasher = sha256();
            const uint8View = new Uint8Array(arrayBuffer);
            this.hasher.add(uint8View);
            this.hexHash = hasher.hex();
            this.hashHasFinished = true;
            this.reportIfFinished();            
        });
        const imageURL = URL.createObjectURL(imageBlob);
        imgElement.src = imageURL;
        imgElement.onload = () => {
            this.imageHashFinished = true;
            this.reportIfFinished();
        }
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
        subSection.addFinishedHandler(() => {
            this.passed = subSection.passed;
            this.reportFinished();
        });
        this.contentElement.appendChild(subSection.headerElement);
        this.contentElement.appendChild(subSection.contentElement);
    }
}

export class TestSection {

    constructor(key, title, level, expectedHexHash) {
        this.key = key;
        this.title = title;
        this.level = level;

        const headerTag =
            (level === 0) ? "h1" :
            (level === 1) ? "h2" :
            (level === 2) ? "h3" :
            "h4";
        
        this.headerElement = document.createElement(headerTag);
        this.contentElement = document.createElement("section");

        const triangleSpan = document.createElement("span");
        triangleSpan.innerHTML = "&#9656;";
        
        const titleSpan = document.createElement("span");
        titleSpan.innerText = title;

        headerElement.appendChild(triangleSpan);
        headerElement.appendChild(titleSpan);
        
        this.expanded = false;
        
        this.paragraphEntries = [];
        this.numberOfUnfinishedParagraphs = 0;

        this.expectedHashHex = expectedHashHex;
        
        this.currLineParagraph = null;
        this.committed = false;
        this.finished = false;
        this.finishedListeners = [];
        this.passed = true;
    }

    _addParagraph(paragraph) {
        this.paragraphEntries.push({
            paragraph: paragraph,
            finished: false,
        });
        this.numberOfUnfinishedParagraphs++;
    }
    
    addSection(subSection, noHash) {
        if (this.currLineParagraph !== null) {
            currLineParagraph.commit();
            this.currLineParagraph = null;
        }
        const subSectionParagraph = this._addParagraph(
            new SubSectionTestParagraph(this, this.paragraphs.length, subSection, noHash));
    }
    
    addImage(blob, noHash) {
        const imageParagraph = this._addParagraph(
            new ImageTestParagraph(this, this.paragraphs.length, blob, noHash));
    }

    addLine(str, noHash) {
        if (this.currLineParagraph === null) {
             const lineParagraph = this._addParagraph(
                 new LinesTestParagraph(this, this.paragraphs.length));
            this.currLineParagraph = lineParagraph;
        }
        this.currLineParagraph.addLine(str, noHash);
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
            finish();
        }
    }
    
    finish() {
        if (this.finished) {
            throw new Error("can't finish section more than once");
        }
        this.finished = true;
        const hasher = sha256();
        for (const paragraph of this.paragraphs) {
            hasher.add(paragraph.hashHex);
        }
        const hashHex = this.hasher.hex();
        if (expectedHashHex !== null) {
            if (hashHex !== this.expectedHashHex) {
                this.passed = false;
            }
        }
        for (finishedListener of this.finishedListeners) {
            finishedListener(this);
        }
    }

    addFinishedListener(finishedListener) {
        this.finishedListeners.push(finishedListener);
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

    constructor(mainEnclosing) {
        this.sectionStack = [];
        this.outputLine = (str, isErronous) => {
            this.logLine(str, isErronous)
        }
        this.currSectionElement = null;
        this.currSectionHeaderElement = null;
        this.currSectionTitle = null;
        this.currSectionHasher = null;
        this.mainEnclosing = mainEnclosing;
        this.currEnclosing = this.mainEnclosing;
    }
    
    startSection(sectionTitle) {
        let sectionHeaderTag;
        if (this.sectionStack.length >= 3) {
            sectionHeaderTag = "h4";
        } else if (this.sectionStack.length === 2) {
            sectionHeaderTag = "h3";
        } else if (this.sectionStack.length === 1) {
            sectionHeaderTag = "h2";
        } else if (this.sectionStack.length === 0) {
            sectionHeaderTag = "h1";
        }
        const sectionHeaderElement = document.createElement(sectionHeaderTag);
        sectionHeaderElement.innerHTML = `&#9656;  ${sectionTitle}`;
        const sectionElement = document.createElement("section");
        sectionHeaderElement.onclick = (evt) => {
            if (sectionElement.style.display !== "block") {
                sectionHeaderElement.innerHTML = `&#9662; ${sectionTitle}`;
                sectionElement.style.display = "block";        
            } else {
                sectionHeaderElement.innerHTML = `&#9656; ${sectionTitle}`;
                sectionElement.style.display = "none"; 
            }
        };
        sectionElement.style.display = "none";

        if (this.currSectionElement !== null) {
            this.sectionStack.push({ 
                sectionHeaderElement: this.currSectionHeaderElement,
                sectionElement: this.currSectionElement, 
                sectionTitle: this.currSectionTitle,
                sectionHasher: this.currSectionHasher,
            });
        }

        this.currSectionHeaderElement = sectionHeaderElement;
        this.currSectionElement = sectionElement;
        this.currSectionTitle = sectionTitle;
        this.currSectionHasher = sha256();
        
        this.currEnclosing.appendChild(sectionHeaderElement);
        this.currEnclosing.appendChild(sectionElement);
        this.currEnclosing = sectionElement;

        return;
    }

    endSection(sectionTitlePrefix, expectedHashHex) {
        if (this.sectionElement === null) {
            throw new Error("no section to close")
        }
        if (!this.currSectionTitle.startsWith(sectionTitlePrefix)) {
            throw new Error(`unmatched endSection request: asked for title prefix: ${sectionTitlePrefix}: actual top section title was: ${sectionTitle}`);
        }

        let hashHex;
        if (expectedHashHex !== undefined) {
            hashHex = this.currSectionHasher.digest().hex();
            const pass = hashHex === expectedHashHex
            if (!pass) {
                this.logHash(hashHex);
                this.currSectionHeaderElement.style = "color: red;";
            } else {
                this.currSectionHeaderElement.style = "color: green;";
            }
        }
        
        if (this.sectionStack.length > 0) {
            const {
                sectionHeaderElement,
                sectionElement, 
                sectionTitle,
                sectionHasher,
            } = this.sectionStack.pop();
            this.currSectionHeaderElement = sectionHeaderElement;
            this.currSectionElement = sectionElement;
            this.currSectionTitle = sectionTitle;
            this.currSectionHasher = sectionHasher;
            this.currEnclosing = this.currSectionElement;
            if (expectedHashHex !== undefined) {
                sectionHasher.add(hashHex);
            }
        } else {
            this.currSectionHeaderElement = null;
            this.currSectionElement = null;
            this.currSectionTitle = null;
            this.currSectionHasher = null;
            this.currEnclosing = this.mainEnclosing;
        }
    }
    
    logLine(str, isErronous) {
        const preLine = document.createElement("pre")
        preLine.innerText = str;
        if (isErronous !== undefined) {
            if (isErronous) {
                preLine.setAttribute("style", "color: red;");
            } else {
                preLine.setAttribute("style", "color: green;");
            }
        }
        this.currEnclosing.appendChild(preLine);
        this.currSectionHasher.add(str);
        return;
    }

    logHash(str, isErronous) {
        const preLine = document.createElement("pre")
        preLine.innerText = str;
        preLine.setAttribute("style", "color: red;");
        this.currEnclosing.appendChild(preLine);
        return;
    }
    
    logImage(dataURL, isErronous) {
        const imageElement = document.createElement("img");
        imageElement.src = dataURL;
        if (isErronous) {
            canvasElement.setAttribute("style", "background-color: red; color: white;")
        }
        this.currEnclosing.appendChild(imageElement);
        return;
    }

    createCanvas(width, height) {
        const canvasElement = document.createElement("canvas");
        canvasElement.width = width;
        canvasElement.height = height;
        return canvasElement;
    }
}

