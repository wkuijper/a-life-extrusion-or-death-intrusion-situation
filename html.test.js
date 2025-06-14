export class TestReport {

    constructor(mainEnclosing, mainTitle) {
        this.sectionStack = [];
        this.outputLine = (str, isErronous) => {
            this.logLine(str, isErronous)
        }
        const mainSectionHeaderElement = document.createElement("h1");
        mainSectionHeaderElement.innerText = mainTitle;
        mainEnclosing.appendChild(mainSectionHeaderElement);
        const mainSectionElement = document.createElement("section");
        mainEnclosing.appendChild(mainSectionElement);
        this.currSectionElement = mainSectionElement;
        this.currSectionHeaderElement = mainSectionHeaderElement;
        this.currSectionTitle = mainTitle;
        this.currSectionDigestBuffer = new ArrayBuffer();
        this.currEnclosing = mainSectionElement;
        
    }
    
    startSection(sectionTitle) {
        let sectionHeaderTag;
        if (this.sectionStack.length >= 3) {
            sectionHeaderTag = "h5";
        } else if (this.sectionStack.length === 2) {
            sectionHeaderTag = "h4";
        } else if (this.sectionStack.length === 1) {
            sectionHeaderTag = "h3";
        } else if (this.sectionStack.length === 0) {
            sectionHeaderTag = "h2";
        }
        const sectionHeaderElement = document.createElement(sectionHeaderTag);
        sectionHeaderElement.innerText = sectionTitle;
        const sectionElement = document.createElement("section");
        sectionHeaderElement.onclick = (evt) => {
            if (sectionElement.style.display !== "block") {
                sectionElement.style.display = "block";        
            } else {
                sectionElement.style.display = "none"; 
            }
        };
        sectionElement.style.display = "none";

        this.sectionStack.push({ 
            sectionHeaderElement: this.currSectionHeaderElement,
            sectionElement: this.currSectionElement, 
            sectionTitle: this.currSectionTitle 
        });

        this.currSectionHeaderElement = sectionHeaderElement;
        this.currSectionElement = sectionElement;
        this.currSectionTitle = sectionTitle;
        
        this.currEnclosing.appendChild(sectionHeaderElement);
        this.currEnclosing.appendChild(sectionElement);
        this.currEnclosing = sectionElement;

        return;
    }

    endSection(sectionTitlePrefix) {
        if (this.sectionStack.length < 1) {
            throw new Error("no section to close")
        }
        if (!this.currSectionTitle.startsWith(sectionTitlePrefix)) {
            throw new Error(`unmatched endSection request: asked for title prefix: ${sectionTitlePrefix}: actual top section title was: ${sectionTitle}`);
        }
        const {
            sectionHeaderElement,
            sectionElement, 
            sectionTitle,
        } = this.sectionStack.pop();
        
        this.currSectionHeaderElement = sectionHeaderElement;
        this.currSectionElement = sectionElement;
        this.currSectionTitle = sectionTitle;
        this.currEnclosing = this.currSectionElement;
    }
    
    logLine(str, isErronous) {
        const preLine = document.createElement("pre")
        preLine.innerText = str;
        if (isErronous) {
            preLine.setAttribute("style", "background-color: red; color: color: white;")
        }
        this.currEnclosing.appendChild(preLine);
        return;
    }
    
    logImage(dataURL, isErronous) {
        const imageElement = document.createElement("img");
        img.src = dataURL;
        if (isErronous) {
            canvasElement.setAttribute("style", "background-color: red; color: white;")
        }
        this.currEnclosing.appendChild(imgElement);
        return;
    }
}

