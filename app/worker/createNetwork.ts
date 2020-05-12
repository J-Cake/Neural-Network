import Network from "../nn/lib";
import _activations from "./activations";
import StateManager from "../src/stateManager";
import MockNetwork from "../src/mockNetwork";
import {state} from "../src/msgChannel";
import State from "./globState";
import convertToMockNetwork from "./convertToMockNetwork";
import convertToFunctions, {funcStrings} from "./convertToFunctions";
import activations from "./activations";


export default function (stateManager: StateManager<State>) {
    return function createNetwork(this: StateManager<state>, data: {
        neuronConfig: number[],
        learningRate: number,
        trainingSubset: number,
        userFunctions: funcStrings,
        activationFunctions: (keyof funcStrings)[],
        initSeed: string
    }): MockNetwork {
        // const activations = _activations(data.neuronConfig);
        const activations = convertToFunctions(data.userFunctions, data.activationFunctions);

        const state: State = stateManager.setState({
            network: new Network(data.neuronConfig, activations, data.learningRate, data.trainingSubset, data.initSeed),
            neuronConfig: data.neuronConfig,
            activationConfig: activations,
            trainingSubset: data.trainingSubset,
            initSeed: data.initSeed
        });

        return convertToMockNetwork(state.network);
    };

};
