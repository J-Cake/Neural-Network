import msgChannel, {state} from "../src/msgChannel";
import StateManager from "../src/stateManager";
import createNetwork from "./createNetwork";
import initTraining from "./initTraining";
import State from "./globState";
import feedForward from "./feedForward";

const stateManager: StateManager<State> = new StateManager<State>({
    targetError: Infinity,
    error: [],
    lastUpdate: Date.now()
});

const msgStateMgr: StateManager<state> = new StateManager<state>({
    // @ts-ignore
    msgTarget: <T>(msg: { fId: number, data: T, name: string }) => postMessage(msg),
    procName: 'Worker',
    functions: [],
    requests: [],
    requestHandlers: {
        createNetwork: createNetwork(stateManager),
        initTraining: initTraining(stateManager),
        feedForward: feedForward(stateManager)
    },
});

stateManager.setState({
    msgChannel: msgChannel(msgStateMgr) // don't forget to initialise the message channel.
});

onmessage = function (msg: MessageEvent) {
    if (msg.data && 'fId' in msg.data)
        msgStateMgr.dispatch('message', {
            incomingMsg: {
                fId: msg.data.fId,
                data: msg.data.data,
                name: msg.data.name
            }
        });
};
