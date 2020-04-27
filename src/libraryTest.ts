import * as sourceMap from 'source-map-support';

import Network, {example} from "./lib";
import {fill, sig, sigp} from "./utils";

sourceMap.install();

const layerSizes: number[] = [3, 2, 1];
const activations = fill(3, () => ({f: sig, fPrime: sigp}));

const network = new Network(layerSizes, activations);

const trainingData: example[] = [
    {
        inputs: [0, 0, 0],
        expected: [0]
    },
    {
        inputs: [0, 0, 1],
        expected: [1]
    },
    {
        inputs: [0, 1, 0],
        expected: [1]
    },
    {
        inputs: [0, 1, 1],
        expected: [0]
    },
    {
        inputs: [1, 0, 0],
        expected: [1]
    },
    {
        inputs: [1, 0, 1],
        expected: [0]
    },
    {
        inputs: [1, 1, 0],
        expected: [0]
    }
];
const testSample: example = {
    inputs: [1, 1, 1],
    expected: [0]
};

console.log("Before Training: Testing on Inputs:", testSample.inputs.join(", "));
console.log(network.evaluate(testSample.inputs).join(', '));

console.log();

const startTime: Date = new Date();

console.log("Initiating Training");
console.log("Network Error:", network.train(trainingData, 1e10));

console.log("Finished training in", new Date().getTime() - startTime.getTime() + "ms");

console.log();

console.log("After Training: Testing on Inputs:", testSample.inputs.join(", "));
console.log(network.evaluate(testSample.inputs).join(', '));
