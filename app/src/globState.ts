import {example} from "../nn/lib";
import {fill, sig, sigp} from "../nn/utils";
import MockNetwork from './mockNetwork';

import trainingData from "../nn/trainingData";
import StateManager from "./stateManager";
import {channelFn, state} from "./msgChannel";

export default interface State {
    neuronConfig: number[],
    activationConfig: { f: (x: number) => number, fPrime: (x: number) => number }[],
    learningRate: number,
    trainingCycles: number,
    trainingSet: example[],
    trainingSubset: number,
    targetError: number,
    network: MockNetwork,
    worker: Worker,
    onTrainData: (info: { error: number, iterations: number }) => boolean,
    haltTraining: boolean,
    procName: string,
    msgStateMgr: StateManager<state>
    msgChannel: channelFn,
    error: number[]
};

export const defaults: Partial<State> = {
    neuronConfig: [3, 4, 2],
    activationConfig: fill(2, () => ({f: sig, fPrime: sigp})),
    learningRate: 0.3,
    trainingSubset: 0,
    trainingCycles: 1e4,
    trainingSet: trainingData,
    targetError: Infinity,
    error: []
};
