import Network, {example} from "./lib";
import {fill, sig, sigp} from "./utils";
import trainingData from "./trainingData";

const layerSizes: number[] = [3, 2, 1];
const activations = fill(layerSizes.length - 1, () => ({f: sig, fPrime: sigp}));

const network = new Network(layerSizes, activations);

const testSample: example = {
    inputs: [1, 1, 1],
    expected: [0]
};

console.log("Before Training: Testing on Inputs:", testSample.inputs.join(", "));
console.log(network.evaluate(testSample.inputs).join(', '));

console.log();

const startTime: Date = new Date();

console.log("Initiating Training");
console.log("Network Error:", network.train(trainingData, ({iterations}) => iterations < 1e4));

console.log("Finished training in", new Date().getTime() - startTime.getTime() + "ms");

console.log();

console.log("After Training: Testing on Inputs:", testSample.inputs.join(", "));
console.log(network.evaluate(testSample.inputs).join(', '));
