export interface MockLayer {
    weights: number[][];
    biases: number[];
    activations: number[];
    weightChange: number[][];
    biasChange: number[];
    weightUpdateCount: number;
    biasUpdateCount: number;
    activation: (x: number) => number;
    activationPrime: (x: number) => number;
    isInputLayer: boolean;
    layerIndex: number
    prevLayer: MockLayer;
}

export default interface MockNetwork {
    layers: MockLayer[];
    learningRate: number;
    trainingSubset: number;
    lastKnownError: number;
}
