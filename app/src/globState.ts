import {example} from "../nn/lib";
import MockNetwork from './mockNetwork';

import StateManager from "./stateManager";
import {channelFn, state} from "./msgChannel";
import {funcStrings} from "../worker/convertToFunctions";

export default interface State {
    neuronConfig: number[],
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
    error: number[],
    errorScrollLevel: number,
    minError: number,
    maxError: number,
    userFunctions: funcStrings,
    activationFunctions: string[],
    graphIntervals: number,
    errorZoomLevel: number,
    initSeed: string,
    isTraining: boolean,
    onTrainFnc: () => Promise<void>,
    exampleFn: (stateManager: StateManager<State>) => void,
    addExample: (container: JQuery, stateManager: StateManager<State>, preload?: example) => Promise<example>,
    graphColour: {
        red: number,
        green: number,
        blue: number
    }
};
