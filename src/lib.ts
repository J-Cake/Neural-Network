import * as sr from 'seedrandom';
import {dot, dotVector, fill, transpose} from "./utils";

type activations = { f: (x: number) => number, fPrime: (x: number) => number };
export type example = { inputs: number[], expected: number[] };

export default class Network {
    readonly layers: Layer[];

    learningRate: number;

    trainingSubset: number;

    constructor(sizes: number[], activationFunctions: activations[], learningRate: number = 0.3, trainingSubset: number = 0) {

        if (sizes.length === activationFunctions.length) {
            this.layers = fill(sizes.length, (a: number, length: number, prev: Layer) =>
                new Layer(sizes[a - 1], sizes[a], activationFunctions[a], prev, a));
        } else
            throw new SyntaxError(`There must be exactly one activation function per layer. ${sizes.length} are required.`);

        this.learningRate = learningRate;
        this.trainingSubset = trainingSubset;
    }

    evaluate(inputs: number[]): number[] {
        let prevOutput: number[] = inputs;

        for (const layer of this.layers) {
            prevOutput = layer.feedForward(prevOutput);

            if (Network.containsNaN(prevOutput))
                throw new TypeError(`NaN Encountered during Forward Cycle`);
        }

        return prevOutput;
    }

    private getError(data: example): number[] {
        const errors: number[] = this.evaluate(data.inputs).map((i, a) => data.expected[a] - i);

        // console.log(errors);
        // NaN occurs because the network is trying to return 3 numbers although only 1 should be outputted. the result is two NaNs.

        if (Network.containsNaN(errors))
            throw new TypeError(`NaN Encountered during error calculation`);

        return errors;
    }

    train(trainingSet: example[], confirm: number | ((error: number) => boolean)): number {
        let iterations: number = 0;

        if (typeof confirm === "number")
            for (let i = 0; i < confirm; i++)
                this.backProp(trainingSet, this.learningRate, iterations++);
        else
            while (confirm(this.getAvgError(trainingSet)))
                this.backProp(trainingSet, this.learningRate, iterations++);

        return this.getAvgError(trainingSet);
    }

    private static containsNaN(list: number[]): boolean {
        return list.findIndex(i => isNaN(i)) > -1;
    }

    private backProp(trainingSet: example[], learningRate: number, repeat: number): void {
        for (const example of Network.getSubset(trainingSet, this.trainingSubset)) {
            let errors: number[] = this.getError(example); // this step already forward propagates

            if (Network.containsNaN(errors))
                throw new TypeError(`NaN Encountered on iteration ${repeat}`);

            const layers = this.layers.map(i => i).reverse();

            for (const layer of layers)
                if (!layer.isInputLayer) {
                    const gradient: number[] = layer.activations.map((i, a) => learningRate * errors[a] * layer.activationPrime(i));

                    if (Network.containsNaN(gradient))
                        throw new TypeError(`NaN Encountered during training: Gradient`);

                    const delta: number[][] = dotVector(gradient, layer.prevLayer.activations);
                    if (delta.map(i => Network.containsNaN(i)).includes(true))
                        throw new TypeError(`NaN Encountered during training: Delta`);

                    layer.updateWeightsFromDeltas(delta);
                    layer.updateBiasesFromGradient(gradient);

                    errors = dot(transpose(layer.weights), errors);
                }
        }

        for (const layer of this.layers)
            layer.applyChanges();
    }

    private static getSubset(trainingSet: example[], subset: number = 0): example[] {
        let examples: example[] = [];

        if (subset <= 0)
            examples = trainingSet;
        else
            for (let i = 0; i < subset; i++)
                if (trainingSet.length > 0)
                    examples.push(trainingSet[Math.floor(Network.random() * trainingSet.length)]);

        return examples;
    }

    private getAvgError(trainingSet: example[]): number {
        // let avgError: number = (x => x.reduce((a, i) => a + i) / x.length)(trainingSet.map(i => (x => x.reduce((a, i) => a + i) / x.length)(this.getError(i))));
        // ^ One Liner to get the average error across the entire training set

        const examples: example[] = Network.getSubset(trainingSet, this.trainingSubset)

        let avgErr: number = 0;

        for (const example of examples) {
            const errors: number[] = this.getError(example);

            for (const error of errors)
                avgErr += error;
        }

        return avgErr / (examples[0].expected.length * examples.length);

    }

    static random: sr = sr(1);
}

class Layer {
    weights: number[][];
    biases: number[];

    private readonly weightChange: number[][];
    private readonly biasChange: number[];
    private weightUpdateCount: number;
    private biasUpdateCount: number;

    activation: (x: number) => number;
    activationPrime: (x: number) => number;

    activations: number[];

    prevLayer: Layer;

    isInputLayer: boolean;
    layerIndex: number;

    constructor(inputNeurons: number, outputNeurons: number, activationFunction: activations, prevLayer?: Layer, layerIndex: number = 0) {
        this.activation = activationFunction.f;
        this.activationPrime = activationFunction.fPrime;

        if (layerIndex !== 0) {
            this.weights = fill(outputNeurons, () => fill(inputNeurons, () => 2 * Network.random() - 1));
            this.biases = fill(outputNeurons, () => Network.random());

            this.weightChange = fill(outputNeurons, () => fill(inputNeurons, () => 0));
            this.biasChange = fill(outputNeurons, () => 0);

            this.weightUpdateCount = 0;
            this.biasUpdateCount = 0;
        }

        if (prevLayer)
            this.prevLayer = prevLayer;

        this.isInputLayer = layerIndex === 0;
        this.layerIndex = layerIndex;
    }

    feedForward(inputs: number[]): number[] {
        if (!this.isInputLayer)
            return this.activations = dot(this.weights, inputs).map((i, a) => this.activation(i + this.biases[a]))
        else
            return this.activations = inputs;
    }

    updateWeightsFromDeltas(delta: number[][]) {
        this.weightChange.forEach((i, a) => i.forEach((j, b) => this.weightChange[a][b] += delta[a][b]));
        this.weightUpdateCount++;
    }

    updateBiasesFromGradient(gradient: number[]) {
        this.biasChange.forEach((i, a) => this.biasChange[a] += gradient[a]);
        this.biasUpdateCount++;
    }

    applyChanges(): void {
        if (!this.isInputLayer) {
            this.weights.forEach((i, a) => i.forEach((j, b) => this.weights[a][b] += this.weightChange[a][b]));
            this.biases.forEach((i, a) => this.biases[a] += this.biasChange[a]);

            this.weightUpdateCount = 0;
            this.biasUpdateCount = 0;

            this.weightChange.forEach((i, a) => i.forEach((j, b) => this.weightChange[a][b] = 0));
            this.biasChange.forEach((i, a) => this.biasChange[a] = 0);
        }
    }
}
