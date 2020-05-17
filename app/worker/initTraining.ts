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
        const state = stateManager.setState();

        if (state.network) {
            state.msgChannel('trainingStart', { // Memory Cruncher
                error: state.error || [0],
                network: state.mockNetwork,
                maxError: 0,
                minError: 0,
                training: true
            });

            const error = state.network.train(data.trainingSet, function (info: {
                error: number,
                iterations: number
            }) {
                const state = stateManager.setState(prev => ({
                    error: [...prev.error, info.error],
                    mockNetwork: convertToMockNetwork(prev.network),
                }));

                return (isFinite(state.targetError) && Math.abs(info.error) < Math.abs(state.targetError)) || info.iterations < data.trainingCycles;
            });

            stateManager.setState().msgChannel('trainingStop', { // Memory Cruncher
                error: state.error || [0],
                network: state.mockNetwork,
                maxError: state.error.reduce((a, i) => Math.max(a, i)),
                minError: state.error.reduce((a, i) => Math.min(a, i)),
                training: false
            });
        }

        return null;
    };
}
