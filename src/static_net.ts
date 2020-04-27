import * as sr from 'seedrandom';
import * as sourceMap from 'source-map-support';

import {fill, dot, sig, sigp, dotVector, transpose} from './utils';

sourceMap.install();

const random: sr = sr(1);

const learningRate: number = 0.3;

const layerSizes: number[] = [2, 3, 1];

// train an xor gate
const inputs = [[0, 0], [1, 0], [1, 1]];
const expectedOutputs = [[0], [1], [0]];


// the size of the weight matrix is the number of neurons in the next layer, by the number of neurons in the current
//Input Layer to Hidden layer
const inputLayerWeights: number[][] = fill(layerSizes[1], () => fill(layerSizes[0], () => 2 * random() - 1)); // create a 3 x 2 matrix

// Hidden Layer to Output layer
const hiddenLayerWeights: number[][] = fill(layerSizes[2], () => fill(layerSizes[1], () => 2 * random() - 1)); // create a 1 x 3 matrix

// Input layer biases
const inputLayerBiases: number[] = fill(layerSizes[1], () => 2 * random() - 1);
// Hidden layer biases
const hiddenLayerBiases: number[] = fill(layerSizes[2], () => 2 * random() - 1);

function forwardPropagate(inputs: number[]): number[] {
    // Usually this would be done iteratively, but since this is me figuring out what the fuck I'm doing, I'm gonna do it verbosely.

    const hla = dot(inputLayerWeights, inputs).map((i, a) => sig(i + inputLayerBiases[a]));

    const ola = dot(hiddenLayerWeights, hla).map((i, a) => sig(i + hiddenLayerBiases[a]));

    return ola;
}

function backwardPropagate() {
    const err: number[] = fill(layerSizes[2], () => 0);

    for (var exampleIndex = 0; exampleIndex < inputs.length; exampleIndex++) {
        const input: number[] = inputs[exampleIndex];
        const expectedOutput: number[] = expectedOutputs[exampleIndex];

        // Variables in use
        /**
         * hla: Hidden Layer Activations
         * ola: Output Layer Activations
         * ole: Output Layer Error
         * olg: Output Layer Gradient
         * old: Output Layer Delta
         * hle: Hidden Layer Error
         * hlg: Hidden Layer Gradient
         * hld: Hidden Layer Delta
         */

        // forward step
        const hla = dot(inputLayerWeights, input).map((i, a) => sig(i + inputLayerBiases[a]));
        const ola = dot(hiddenLayerWeights, hla).map((i, a) => sig(i + hiddenLayerBiases[a]));

        // Calculate error
        const ole: number[] = ola.map((i, a) => expectedOutput[a] - i);
        // Calculate gradient
        const olg: number[] = ola.map((i, a) => learningRate * ole[a] * sigp(i));
        // Calculate delta
        const old: number[][] = dotVector(olg, hla);

        // update adjustments

        hiddenLayerWeights.forEach((i, a) => i.forEach((j, b) => hiddenLayerWeights[a][b] = old[a][b] + j));
        hiddenLayerBiases.forEach((i, a) => hiddenLayerBiases[a] = olg[a] + i);

        // update the average errors
        ole.forEach((i, a) => err[a] += i);

        // Repeat for previous layer

        // Calculate error
        const hle: number[] = dot(transpose(hiddenLayerWeights), ole);
        // Calculate gradient
        const hlg: number[] = hla.map((i, a) => learningRate * hle[a] * sigp(i));
        // Calculate  delta
        const hld: number[][] = dotVector(hlg, input);

        // update adjustments

        inputLayerWeights.forEach((i, a) => i.forEach((j, b) => inputLayerWeights[a][b] = hld[a][b] + j));
        inputLayerBiases.forEach((i, a) => inputLayerBiases[a] = hlg[a] + i);
    }

    console.log("Avg error:", err.map(i => i / exampleIndex).join(', '));
}

function guessExamples() {
    console.log("Guessing trained input [0, 0] = [0]");
    console.log(forwardPropagate([0, 0]));

    console.log("Guessing untrained input [0, 1] = [1]");
    console.log(forwardPropagate([0, 1]));

    console.log("Guessing trained input [1, 0] = [1]");
    console.log(forwardPropagate([1, 0]));

    console.log("Guessing trained input [1, 1] = [0]");
    console.log(forwardPropagate([1, 1]));
}

function train() {
    guessExamples();

    console.log("\nBefore Training:", forwardPropagate([1, 0]));

    // const repetitions = 10e7;
    const repetitions = 1e4;

    for (let i = 0; i < repetitions; i++) {
        console.log(`\nIteration ${i + 1} ---`);
        backwardPropagate();
    }

    console.log("\nAfter Training:", forwardPropagate([1, 0]), "\n");

    guessExamples();
}

train();
