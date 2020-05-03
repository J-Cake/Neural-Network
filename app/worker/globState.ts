import Network, {activations, example} from "../nn/lib";
import {channelFn} from "../src/msgChannel";

export default interface State {
    trainingData: example[],
    trainingCycles: number,
    neuronConfig: number[],
    activationConfig: activations[],
    trainingSubset: number,
    network: Network,
    targetError: number,
    msgChannel: channelFn
};
