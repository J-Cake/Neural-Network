import Network, {activations, example} from "../nn/lib";
import {channelFn} from "../src/msgChannel";
import MockNetwork from "../src/mockNetwork";

export default interface State {
    trainingData: example[],
    trainingCycles: number,
    neuronConfig: number[],
    activationConfig: activations[],
    trainingSubset: number,
    network: Network,
    targetError: number,
    msgChannel: channelFn,
    error: number[],
    mockNetwork: MockNetwork,
    lastUpdate: number,
    initSeed: string
};
