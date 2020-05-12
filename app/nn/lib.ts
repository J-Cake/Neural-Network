import * as sr from 'seedrandom';
import {dot, dotVector, fill, sig, sigp, transpose} from "./utils";

export type activations = { f: (x: number) => number, fPrime: (x: number) => number };
export type example = { inputs: number[], expected: number[] };

export default class Network {
    readonly layers: Layer[];

    learningRate: number;

    trainingSubset: number;

    lastKnownError: number;

    seed: string;
    random: sr.prng;

    constructor(sizes: number[], activationFunctions: activations[], learningRate: number = 0.3, trainingSubset: number = 0, seed?: string) {
        this.seed = seed || fill(Math.floor((Math.random() * 10) + 5), () => (a => a[Math.floor(Math.random() * a.length)])('abcedfghijklmonpqrstuvwxyzABCDEFGHIJKLMONPQRSTUVXYZ0123456789')).join('');

        console.log('Initialising from number seed:', this.seed, 'provided seed:', seed || '<none>');
        this.random = sr(this.seed);

        if (sizes.length === activationFunctions.length + 1) {
            this.layers = fill(sizes.length, (a: number, length: number, prev: Layer) => {
                return new Layer(sizes[a - 1], sizes[a], activationFunctions[a - 1], this.random, prev, a);
            });
        } else
            throw new SyntaxError(`There must be exactly one activation function per layer. ${sizes.length - 1} are required.`);

        this.learningRate = learningRate;
        this.trainingSubset = trainingSubset;
        this.lastKnownError = 0;
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

    train(trainingSet: example[], onUpdate: (info: { error: number, iterations: number }) => boolean): number {
        let iterations: number = 0;
        //     for (let i = 0; i < confirm; i++)
        //         if (onUpdate && onUpdate({error: this.lastKnownError, iterations}))
        //             this.backProp(trainingSet, this.learningRate, iterations++);
        // } else {
        while (onUpdate({error: this.getAvgError(trainingSet), iterations}))
            this.backProp(trainingSet, this.learningRate, iterations++);
        // }

        return this.getAvgError(trainingSet);
    }

    private static containsNaN(list: number[]): boolean {
        return list.findIndex(i => isNaN(i)) > -1;
    }

    private backProp(trainingSet: example[], learningRate: number, repeat: number): void {
        for (const example of Network.getSubset(trainingSet, this.trainingSubset, this.random)) {
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

    private static getSubset(trainingSet: example[], subset: number = 0, prng: sr.prng): example[] {
        let examples: example[] = [];

        if (subset <= 0)
            examples = trainingSet;
        else
            for (let i = 0; i < subset; i++)
                if (trainingSet.length > 0)
                    examples.push(trainingSet[Math.floor(prng() * trainingSet.length)]);

        return examples;
    }

    private getAvgError(trainingSet: example[]): number {
        // let avgError: number = (x => x.reduce((a, i) => a + i) / x.length)(trainingSet.map(i => (x => x.reduce((a, i) => a + i) / x.length)(this.getError(i))));
        // ^ One Liner to get the average error across the entire training set

        const examples: example[] = Network.getSubset(trainingSet, this.trainingSubset, this.random)

        let avgErr: number = 0;

        for (const example of examples) {
            const errors: number[] = this.getError(example);

            for (const error of errors)
                avgErr += error;
        }

        return this.lastKnownError = avgErr / (examples[0].expected.length * examples.length);

    }
}

export class Layer {
    weights: number[][] = [];
    biases: number[] = [];

    readonly weightChange: number[][] = [];
    readonly biasChange: number[] = [];
    weightUpdateCount: number = 0;
    biasUpdateCount: number = 0;

    activation: (x: number) => number = sig;
    activationPrime: (x: number) => number = sigp;

    activations: number[] = [];

    prevLayer: Layer = null as any as Layer;

    isInputLayer: boolean;
    layerIndex: number;

    constructor(inputNeurons: number, outputNeurons: number, activationFunction: activations, prng: sr.prng, prevLayer?: Layer, layerIndex: number = 0) {
        if (layerIndex !== 0) {
            this.activation = activationFunction.f;
            this.activationPrime = activationFunction.fPrime;

            this.weights = fill(outputNeurons, () => fill(inputNeurons, () => 2 * prng() - 1));
            this.biases = fill(outputNeurons, () => prng());

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
