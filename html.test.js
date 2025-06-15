import { sha256 } from "./sha256.js";

export class TestSection {

    constructor(key, title, headerElement, contentElement, expectedHexHash) {
        this.key = key;
        this.title = title;
        this.headerElement = headerElement;
        this.contentElement = contentElement;

        const triangleSpan = document.createElement("span");
        triangleSpan.innerHTML = "&#9656;";
        
        const titleSpan = document.createElement("span");
        titleSpan.innerText = title;

        headerElement.appendChild(triangleSpan);
        headerElement.appendChild(titleSpan);
        
        this.expanded = false;
        this.subSections = [];

        this.expectedHashHex = expectedHashHex;
        this.hasher = sha256();
        
        this.passStatus = "inconclusive";
    }

    addLine(str, noHash) {
        if (!noHash) {
            this.hasher.add(str);
        }
        const preLine = document.createElement("pre")
        preLine.innerText = str;
        this.contentElement.appendChild(preLine);
    }

    addImage(url) {
        const imgElement = document.createElement("img");
        imgElement.src = url;
        this.contentElement.appendChild(imgElement); 
    }

    finish() {
        const hashHex = this.hasher.hex();
        if (expectedHashHex !== null) {
            if (hashHex !== this.expectedHashHex) {
                this.passStatus = "failed";
            } else {
                this.passStatus = "success";
            }
        } else {
            this.passStatus = "escalated";
        }
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
        this.expanded = true;
    }

    collapse() {
        if (!this.expanded) {
            return;
        }
        this.triangleSpan.innerHTML = "&#9656;";
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

