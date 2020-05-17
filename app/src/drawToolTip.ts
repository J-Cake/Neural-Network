import * as _p5 from "p5";

export interface p5 extends _p5 {
    totalDialogHeight: number
}

export default function drawToolTip(_text: string, sketch: p5, background: string) {
    sketch.colorMode(sketch.RGB);
    sketch.stroke(180, 180, 180);
    sketch.fill(background);

    const strokeWeight = 2;

    const text = _text.trim();

    const padding = 8;
    const textSize = 11;

    const textHeight = textSize * (Array.from(String(text)).filter(i => /\s/.test(i)).length + 1);

    if (text) {
        const width = Math.max(...text.split(/\s/g).map(text => sketch.textWidth(text.trim()))) + 2 * padding;
        const height = 2 * padding + textHeight;

        sketch.rect(sketch.mouseX >= sketch.width - width ? sketch.mouseX - width : sketch.mouseX, sketch.mouseY - height - sketch.totalDialogHeight, width, height);

        sketch.fill(180, 180, 180);
        sketch.noStroke();
        sketch.textSize(textSize);
        sketch.textAlign(sketch.LEFT);
        sketch.text(String(text), (sketch.mouseX >= sketch.width - width ? sketch.mouseX - width : sketch.mouseX) + padding, sketch.mouseY - textHeight - sketch.totalDialogHeight); // the origin of a text string is bottom left corner of the bounding box

        sketch.totalDialogHeight += height;
    }
}
