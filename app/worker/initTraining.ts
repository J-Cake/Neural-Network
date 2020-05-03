import StateManager from "../src/stateManager";
import {example} from "../nn/lib";
import {state} from "../src/msgChannel";
import State from "./globState";
import convertToMockNetwork from "./convertToMockNetwork";

export default function (stateManager: StateManager<State>) {
    return function initTraining(this: StateManager<state>, data: {
        trainingSet: example[],
        trainingCycles: number,
        targetError: number
    }): number | null {
        console.log('Starting Training');
        const state = stateManager.setState();

        if (state.network)
            return state.network.train(data.trainingSet, function (info: {
                error: number,
                iterations: number
            }) {
                void state.msgChannel('trainingUpdate', {
                    error: info.error,
                    network: convertToMockNetwork(state.network)
                });

                return (isFinite(state.targetError) && info.error < state.targetError) || info.iterations < data.trainingCycles;
            });

        return null;
    };
}
