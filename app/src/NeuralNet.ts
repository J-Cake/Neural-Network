import * as _p5 from 'p5';
import MockNetwork from "./mockNetwork";
import StateManager from "./stateManager";
import State from "./globState";
import drawToolTip, {p5} from "./drawToolTip";

export default async function displayNetwork(stateManager: StateManager<State>, parent: JQuery) {
    new _p5(function (sketch: p5) {
        const neuronColours: _p5.Color[] = [
            sketch.color("#ffe850"),
            sketch.color("#ff5900"),
            sketch.color("#cc2d1d"),
            sketch.color("#12ee00"),
            sketch.color("#13669d"),
            sketch.color("#7ac4f5"),
            sketch.color("#a17de3"),
            sketch.color("#562f9f"),
            sketch.color("#cf5de8"),
            sketch.color("#78108f"),
            sketch.color("#b42668")
        ];

        sketch.setup = function () {
            const canvas: _p5.Renderer = sketch.createCanvas(parent.width() || 180, parent.height() || 70);

            canvas.parent(parent.attr('id') || 'network-visualiser');

            sketch.colorMode(sketch.HSB);

            sketch.totalDialogHeight = 0;
        };

        sketch.draw = function () {
            sketch.smooth();

            const colour = parent.css('background-color');

            if (colour)
                sketch.background(colour);
            else
                sketch.background(255);

            const network: MockNetwork | null = stateManager.setState().network || null;

            if (network) {
                sketch.noStroke();

                const neuronSize: number = sketch.height / ((function (): number {
                    let maxNeuronCount: number = 0;

                    for (const layer of network.layers) {
                        if (layer.weights && layer.weights[0])
                            if (layer.weights && layer.weights.length > maxNeuronCount)
                                maxNeuronCount = layer.weights.length;
                            else if (layer.weights && layer.weights[0].length > maxNeuronCount)
                                maxNeuronCount = layer.weights[0].length;
                    }

                    return maxNeuronCount;
                })() * 1.5);

                const getCoordsForNeuron = function (neuron: number, layer: number): { x: number, y: number } {
                    const neuronsInLayer: number = network.layers[layer].isInputLayer ? network.layers[1].weights[0].length : network.layers[layer].weights.length;

                    const containerTop = (sketch.height / 2) - (neuronsInLayer * neuronSize) / 2;

                    return {
                        x: (sketch.width / network.layers.length) * (layer + 0.5),
                        y: containerTop + (neuron * neuronSize) - (neuronSize / 2)
                    }
                }

                const weightsToShow: number[] = [];

                let minWeight = -2,
                    maxWeight = 2;

                // type nestedArray<T> = (T|nestedArray<T>[])[];
                // const deepFlatten = function<T>(arr: nestedArray<T>): T[] {
                //     const flatten = (arr: T[][]): T[] => new Array<T>().concat(...arr);
                //
                //     return flatten(arr.map(i => i instanceof Array ? deepFlatten(i) : i));
                // }

                // const linearWeights = deepFlatten<number>(network.layers.map(i => i.weights));
                const linearWeights = network.layers.map(i => i.weights).flat(Infinity);

                if (linearWeights.length > 0) {
                    minWeight = linearWeights.reduce((a, i) => a < i ? a : i);
                    maxWeight = linearWeights.reduce((a, i) => a > i ? a : i);
                }

                for (const layer of network.layers) {
                    const neuronsInLayer: number = layer.isInputLayer ? network.layers[1].weights[0].length : layer.weights.length;
                    // const containerTop = (sketch.height / 2) - (neuronsInLayer * neuronSize) / 2;

                    for (let i = 1; i <= neuronsInLayer; i++) {

                        sketch.stroke(0, 10, 40, 30);

                        // sketch.fill(sketch.map(layer.layerIndex, 0, network.layers.length, 0, 255), sketch.map(layer.activations[i - 1] || 0, 0, 1, 0, 100), 100, 50);
                        const colour = neuronColours[Math.floor(sketch.map(layer.layerIndex, 0, network.layers.length, 0, neuronColours.length))];

                        sketch.fill(sketch.hue(colour), sketch.saturation(colour), sketch.brightness(colour));

                        const coords = getCoordsForNeuron(i, layer.layerIndex);

                        if (network?.layers[layer.layerIndex + 1]) {
                            const nextLayer = network?.layers[layer.layerIndex + 1];

                            for (let j = 1; j <= nextLayer.weights.length; j++) {
                                const weight: number = sketch.map(nextLayer?.weights[j - 1][i - 1], minWeight, maxWeight, 1, 4);

                                sketch.strokeWeight(weight);
                                const neuronCoords = getCoordsForNeuron(j, layer.layerIndex + 1);

                                if (sketch.mouseX > Math.min(coords.x, neuronCoords.x) &&
                                    sketch.mouseX < Math.max(neuronCoords.x, coords.x) &&
                                    sketch.mouseY > Math.min(coords.y, neuronCoords.y) &&
                                    sketch.mouseY < Math.max(neuronCoords.y, coords.y)) {

                                    const offsetAngle = sketch.createVector(neuronCoords.x, neuronCoords.y).sub(sketch.createVector(coords.x, coords.y)).heading() - sketch.createVector(neuronCoords.x, neuronCoords.y).sub(sketch.createVector(sketch.mouseX, sketch.mouseY)).heading();

                                    const r = sketch.dist(neuronCoords.x, neuronCoords.y, sketch.mouseX, sketch.mouseY) * Math.sin(offsetAngle);

                                    if (Math.abs(r) < 3) {
                                        sketch.stroke(sketch.hue(colour), sketch.saturation(colour), sketch.brightness(colour));
                                        weightsToShow.push(weight);
                                    }
                                }

                                sketch.line(coords.x, coords.y, neuronCoords.x, neuronCoords.y);
                                sketch.stroke(0, 10, 40, 30);
                            }
                        }

                        sketch.strokeWeight(1);

                        sketch.ellipse(
                            coords.x,
                            coords.y,
                            // (sketch.width / network.layers.length) * (layer.layerIndex + 0.5),
                            // containerTop + (i * neuronSize) - (neuronSize / 2),
                            neuronSize / 2,
                            neuronSize / 2
                        );

                        if (typeof layer.activations[i - 1] === 'number')
                            if (sketch.dist(coords.x, coords.y, sketch.mouseX, sketch.mouseY) < neuronSize / 4) // radius / 2 (neuronSize / 2) / 2
                                drawToolTip(String(layer.activations[i - 1]), sketch, parent.css('background-color'));
                        sketch.colorMode(sketch.HSB);
                    }
                }

                if (weightsToShow.length > 0)
                    drawToolTip(String(weightsToShow.join('\n')), sketch, parent.css('background-color'));
                sketch.colorMode(sketch.HSB);
            }

            sketch.totalDialogHeight = 0;
        }

        window.addEventListener("resize", function () {
            sketch.resizeCanvas(parent.width() || 180, parent.height() || 70);
        });
    }, parent[0]);
}
