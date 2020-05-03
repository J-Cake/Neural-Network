import * as _p5 from 'p5';
import MockNetwork from "./mockNetwork";
import StateManager from "./stateManager";
import State from "./globState";

export default function displayNetwork(stateManager: StateManager<State>, parent: JQuery) {
    new _p5(function (sketch: _p5) {
        sketch.setup = function () {
            const canvas: _p5.Renderer = sketch.createCanvas(parent.width() || 180, parent.height() || 70);

            canvas.parent(parent.attr('id') || 'network-visualiser');

            sketch.colorMode(sketch.HSB);
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

                for (const layer of network.layers) {
                    const neuronsInLayer: number = layer.isInputLayer ? network.layers[1].weights[0].length : layer.weights.length;
                    // const containerTop = (sketch.height / 2) - (neuronsInLayer * neuronSize) / 2;

                    for (let i = 1; i <= neuronsInLayer; i++) {

                        sketch.stroke(0, 10, 40, 30);
                        sketch.fill(sketch.map(layer.layerIndex, 0, network.layers.length, 0, 255), sketch.map(layer.activations[i - 1] || 0, 0, 1, 25, 75), 100, 50);

                        const coords = getCoordsForNeuron(i, layer.layerIndex);

                        if (network?.layers[layer.layerIndex + 1]) {
                            const nextLayer = network?.layers[layer.layerIndex + 1];

                            for (let j = 1; j <= nextLayer.weights.length; j++) {
                                const weight: number = sketch.map(nextLayer?.weights[j - 1][i - 1], -2, 2, 0, 2);

                                sketch.strokeWeight(weight);
                                const neuronCoords = getCoordsForNeuron(j, layer.layerIndex + 1);
                                sketch.line(coords.x, coords.y, neuronCoords.x, neuronCoords.y);
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
                    }
                }
            }
        }

        window.addEventListener("resize", function () {
            sketch.resizeCanvas(parent.width() || 180, parent.height() || 70);
        });
    }, parent[0]);
}
