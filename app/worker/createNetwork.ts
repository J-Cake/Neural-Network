import Network from "../nn/lib";
import _activations from "./activations";
import StateManager from "../src/stateManager";
import MockNetwork from "../src/mockNetwork";
import {state} from "../src/msgChannel";
import State from "./globState";
import convertToMockNetwork from "./convertToMockNetwork";


export default function (stateManager: StateManager<State>) {
    return function createNetwork(this: StateManager<state>, data: {
        neuronConfig: number[],
            learningRate: number,
            trainingSubset: number
    }): MockNetwork {
        const activations = _activations(data.neuronConfig);
        const state: State = stateManager.setState({
            network: new Network(data.neuronConfig, activations, data.learningRate, data.trainingSubset),
            neuronConfig: data.neuronConfig,
            activationConfig: activations,
            trainingSubset: data.trainingSubset
        });

        return convertToMockNetwork(state.network);
    };

};
