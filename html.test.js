export const outputLineToPage = (str) => {
    const preLine = document.createElement("pre")
    preLine.innerText = str;
    document.body.appendChild(preLine);
}