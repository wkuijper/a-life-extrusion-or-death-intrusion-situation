import { sha256 } from "./sha256.js";

export class TestParagraph {

    constructor(parentSection, idx) {
        this.parentSection = parentSection;
        this.idx = idx;
        const contentElement = document.createElement("div");
        contentElement.classList.add('paragraph-content');
        this.contentElement = contentElement;
        this.hashHex = "0000000000000000000000000000000000000000000000000000000000000000";
       
        this.finished = false;
        this.failed = false;
        this.passed = false;
    }
    
    reportFinished() {
        if (this.finished) {
            throw new Error("can't report paragraph as finished more than once");
        }
        this.passed = !this.failed;
        this.finished = true;
        this.parentSection.paragraphHasFinished(this);
    }

    reportFailed() {
        if (this.failed) {
            throw new Error("can't report paragraph as failed more than once");
        }
        this.failed = true;
        this.parentSection.paragraphHasFailed(this);
    }
}

export class LinesParagraph extends TestParagraph {

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

export class ImageParagraph extends TestParagraph {
    
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

export class AnimationParagraph extends TestParagraph {
    
    constructor(parentSection, idx, frames, noHash) {
        super(parentSection, idx);

        this.noHash = noHash;

        const headerElement = document.createElement("div");
        this.headerElement = headerElement;

        const counterSpan = document.createElement("span");
        this.counterSpan = counterSpan;
    
        this.headerElement.appendChild(counterSpan);
        
        const expandLink = document.createElement("a");
        expandLink.innerText = "expand";
        expandLink.style.marginLeft = "10px";
        this.expandLink = expandLink;

        this.headerElement.appendChild(expandLink);
        
        const mainElement = document.createElement("div");
        this.mainElement = mainElement;
        
        const numberOfFrames = frames.length;
        this.numberOfFrames = numberOfFrames;
        
        this.frameContainerElements = new Array(numberOfFrames);
        this.frameHashHexes = new Array(numberOfFrames);
        this.numberOfFramesLoaded = 0;
        this.numberOfFramesHashed = 0;

        this.currDisplayingFrameIndex = -1;
        
        for (let i = 0; i < numberOfFrames; i++) {
            const { url, caption } = frames[i];

            const containerElement = document.createElement("div");
                
            const imgElement = document.createElement("img");
            containerElement.appendChild(imgElement);

            if (caption !== undefined) {
                const captionElement = document.createElement("pre");
                captionElement.innerText = caption;
                containerElement.appendChild(captionElement);
            }
            
            this.frameContainerElements[i] = containerElement;
            this.frameHashHexes[i] = "";
            
            if (!this.noHash) {
                fetch(url).then(r => r.blob().arrayBuffer().then((arrayBuffer) => {
                    const hasher = sha256();
                    const uint8View = new Uint8Array(arrayBuffer);
                    hasher.add(caption);
                    hasher.add("\0");
                    hasher.add(uint8View);
                    this.frameHashHexes[i] = hasher.digest().hex();
                    this.numberOfFramesHashed++;
                    this.reportIfFinished();            
                }));
            }
            
            imgElement.onload = () => {
                if (i === 0) {
                    this.mainElement.appendChild(containerElement);
                    this.counterSpan.innerText = `1/${this.numberOfFrames}`;
                    this.currDisplayingFrameIndex = 0;
                }
                this.numberOfFramesLoaded++;
                this.reportIfFinished();
            }
            
            imgElement.src = url;
        }

        //this.contentElement.appendChild(this.headerElement);
        this.contentElement.appendChild(this.mainElement);
        
        mainElement.onclick = (evt) => {
           if (this.currDisplayingFrameIndex >= 0 && this.finished) {
               const currFrameIndex = this.currDisplayingFrameIndex;
               const nextFrameIndex = (currFrameIndex + 1) % this.numberOfFrames;
               const currFrameContainerElement = this.frameContainerElements[currFrameIndex];
               const nextFrameContainerElement = this.frameContainerElements[nextFrameIndex];
               currFrameContainerElement.replaceWith(nextFrameContainerElement);
               this.currDisplayingFrameIndex = nextFrameIndex;
                this.counterSpan.innerText = `${nextFrameIndex+1}/${this.numberOfFrames}`;
           } 
        }
    }

    reportIfFinished() {
        if (this.numberOfFramesLoaded === this.numberOfFrames 
            && (this.noHash || this.numberOfFramesHashed === this.numberOfFrames)) {
            const hasher = sha256();
            for (const hashHex of this.frameHashHexes) {
                hasher.add(hashHex);
            }
            this.hashHex = hasher.digest().hex();
            this.reportFinished();
        }
    }
}

export class SubSectionParagraph extends TestParagraph {
    
    constructor(parentSection, idx, subSection) {
        super(parentSection, idx);
        this.subSection = subSection;
        subSection.addFinishHandler(() => {
            this.hashHex = subSection.hashHex;
            this.reportFinished();
        });
        subSection.addFailHandler(() => {
            this.reportFailed();
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
        contentElement.style.display = "none";
        
        this.headerElement = headerElement;
        this.contentElement = contentElement;

        const triangleSpan = document.createElement("span");
        triangleSpan.classList.add("triangle-span");
        triangleSpan.innerHTML = "&#9656;";
        triangleSpan.onclick = () => {
            this.setExpanded(!this.expanded);  
        };
        this.triangleSpan = triangleSpan;
        
        const titleSpan = document.createElement("span");
        titleSpan.innerText = title;
        this.titleSpan = titleSpan;
        
        headerElement.appendChild(triangleSpan);
        headerElement.appendChild(titleSpan);
        
        this.expanded = false;
        
        this.paragraphEntries = [];
        
        this.numberOfUnfinishedParagraphs = 0;
        this.numberOfFailedParagraphs = 0;
        
        this.currLineParagraph = null;
        
        this.committed = false;
        this.finished = false;
        this.failed = false;
        this.failedHash = false;
        this.passed = false;
        
        this.finishHandlers = [];
        this.failHandlers = [];
        
        this.memoizedPath = null;
    }

    _addParagraph(paragraph) {
        this.paragraphEntries.push({
            paragraph: paragraph,
            finished: false,
            failed: false,
        });
        this.numberOfUnfinishedParagraphs++;
        this.contentElement.appendChild(paragraph.contentElement);
        return paragraph;
    }
    
    addImage(url, noHash) {
        const imageParagraph = this._addParagraph(
            new ImageParagraph(this, this.paragraphEntries.length, url, noHash));
    }

    addAnimation(frames, noHash) {
        const imageParagraph = this._addParagraph(
            new AnimationParagraph(this, this.paragraphEntries.length, frames, noHash));
    }

    addLine(str, noHash) {
        if (this.currLineParagraph === null) {
             const lineParagraph = this._addParagraph(
                 new LinesParagraph(this, this.paragraphEntries.length));
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
            new SubSectionParagraph(this, this.paragraphEntries.length, subSection));
        return subSection;
    }
    
    commit() {
        if (this.committed) {
            throw new Error("can't commit section more than once");
        }
        if (this.currLineParagraph !== null) {
            this.currLineParagraph.commit();    
        }
        this.committed = true;
        this.finishIfPossible();    
    }

    paragraphHasFinished(paragraph) {
        const entry = this.paragraphEntries[paragraph.idx];
        if (entry.finished) {
            throw new Error("invariant violation: paragraph reported as finished more than once");
        }
        entry.finished = true;
        this.numberOfUnfinishedParagraphs--;
        this.finishIfPossible();
    }

    paragraphHasFailed(paragraph) {
        const entry = this.paragraphEntries[paragraph.idx];
        if (entry.failed) {
            throw new Error("invariant violation: paragraph reported as failed more than once");
        }
        entry.failed = true;
        this.numberOfFailedParagraphs++;
        this.failIfNeeded();
    }
    
    finishIfPossible() {
        if (this.finished) {
            return;
        }
        if (this.committed &&
            this.numberOfUnfinishedParagraphs === 0) {
            this.finish();
        }
    }
    
    failIfNeeded() {
        if (this.failed) {
            return;
        }
        if (this.failedHash ||
            this.numberOfFailedParagraphs > 0) {
            this.fail();
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
        this.hashHex = hashHex;
        if (this.expectedHashHex !== null && this.hashHex !== this.expectedHashHex) {
            console.error(`${this.path()}: hash failed: ${this.hashHex}`);
            this.failedHash = true;
            this.failIfNeeded();
        }
        if (!this.failed) {
            this.pass();
        }
        for (const finishHandler of this.finishHandlers) {
            finishHandler(this);
        }
    }

    fail() {
        if (this.failed) {
            throw new Error("can't fail section more than once");
        }
        this.failed = true;
        this.headerElement.classList.add("failed");
        for (const failHandler of this.failHandlers) {
            failHandler(this);
        }
    }

    pass() {
        if (this.passed) {
            throw new Error("can't pass section more than once");
        }
        this.passed = true;
        this.headerElement.classList.add("passed");
    }
    
    addFailHandler(failHandler) {
        this.failHandlers.push(failHandler);
    }
    
    addFinishHandler(finishHandler) {
        this.finishHandlers.push(finishHandler);
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

    path() {
        if (this.memoizedPath === null) {
            if (this.parentSection === null) {
                this.memoizedPath = this.name;
            } else {
                this.memoizedPath = this.parentSection.path() + "/" + this.name;
            }
        }
        return this.memoizedPath;
    }

    expandPath(path) {
        this.expand();
        if (path.length === 0) {
            return;
        }
        let firstSlashIndex = 0;
        while (firstSlashIndex < path.length && path[firstSlashIndex] !== '/') {
            firstSlashIndex++;
        }
        const firstPathElem = firstSlashIndex < path.length ? path.slice(0, firstSlashIndex) : path;
        const restPath = path.slice(firstSlashIndex + 1);
        if (!this.nameToSubsection.has(firstPathElem)) {
            return;
        }
        const subSection = this.nameToSubsection.get(firstPathElem);
        
        subSection.expandPath(restPath); 
    }
}

export class TestReport {

    constructor(mainEnclosing, title, expectedHashHex) {
        const mainSection = new TestSection(null, "", title, expectedHashHex);
        this.mainSection = mainSection;
        this.currSection = mainSection;
        this.outputLine = (str) => {
            this.logLine(str);            
        };
        mainEnclosing.appendChild(mainSection.headerElement);
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
    
    logAnimation(frames, hash) {
        if (hash === undefined) {
            hash = false;
        }
        this.currSection.addAnimation(frames, !hash);
    }

    createCanvas(width, height) {
        const canvasElement = document.createElement("canvas");
        canvasElement.width = width;
        canvasElement.height = height;
        return canvasElement;
    }

    expandPath(path) {
        if (path.length <= 1 || path[0] !== "/") {
            return;
        }
        this.mainSection.expandPath(path.slice(1));
    }
}

