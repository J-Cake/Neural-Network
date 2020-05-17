import StateManager from "../src/stateManager";
import State from "./globState";
import {state} from "../src/msgChannel";

export default function feedForward(stateManager: StateManager<State>) {
    return function feedForward(this: StateManager<state>, data: number[]) {
        const {neuronConfig, network} = stateManager.setState();

        if (data.length === neuronConfig[0])
            return network.evaluate(data);
        else
            return null;
    };
}
