import Network, {Layer} from "../nn/lib";
import MockNetwork, {MockLayer} from "../src/mockNetwork";

export default function convertToMockNetwork(network: Network): MockNetwork {
    const convertToMockLayer: (layer: Layer) => MockLayer = (layer: Layer): MockLayer => ({
        weights: layer.weights,
        biases: layer.biases,
        activations: layer.activations,
        weightChange: layer.weightChange,
        biasChange: layer.biasChange,
        weightUpdateCount: layer.weightUpdateCount,
        biasUpdateCount: layer.biasUpdateCount,
        activation: null as any as (() => number),
        activationPrime: null as any as (() => number),
        isInputLayer: layer.isInputLayer,
        layerIndex: layer.layerIndex,
        prevLayer: layer.prevLayer && convertToMockLayer(layer.prevLayer)
    });

    return {
        layers: network.layers.map(i => i && convertToMockLayer(i)),
        learningRate: network.learningRate,
        trainingSubset: network.trainingSubset,
        lastKnownError: network.lastKnownError
    };
}
