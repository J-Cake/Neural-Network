import * as $ from 'jquery';

import displayNetwork from "./NeuralNet";
import displayErrorGraph from "./error";
import StateManager from "./stateManager";
import globState, {defaults} from "./globState";
import workerChannel, {state} from "./msgChannel";
import MockNetwork from "./mockNetwork";

window.addEventListener("load", function () {
    const stateManager: StateManager<globState> = new StateManager<globState>(defaults);

    stateManager.setState(function (): Partial<globState> {
        const worker: Worker = new Worker('./worker.js');

        const msgChannelStateMgr: StateManager<state> = new StateManager<state>({
            msgTarget: worker.postMessage.bind(worker),
            procName: 'Main',
            functions: [],
            requests: [],
            requestHandlers: {
                trainingUpdate(data: {error: number, network: MockNetwork}) {
                    stateManager.setState(prev => ({
                        network: data.network,
                        error: [...prev.error, data.error]
                    }))
                }
            }
        });

        const channel = workerChannel(msgChannelStateMgr);

        worker.addEventListener('message', function (msg: MessageEvent) {
            if (msg.data && typeof msg.data === 'object' && 'fId' in msg.data)
                msgChannelStateMgr.dispatch('message', {
                    incomingMsg: {
                        fId: msg.data.fId,
                        data: msg.data.data,
                        name: msg.data.name
                    }
                });
        });

        return {
            worker: worker,
            msgStateMgr: msgChannelStateMgr,
            msgChannel: channel
        };
    });

    const {msgChannel, neuronConfig, learningRate, trainingSubset} = stateManager.setState();

    if (msgChannel)
        msgChannel<MockNetwork>('createNetwork', {
            neuronConfig: neuronConfig,
            learningRate: learningRate,
            trainingSubset: trainingSubset
        }).then((network: MockNetwork) => {
            stateManager.setState({
                network: network
            });
        });

    const trainBtn = $('#train-btn');
    trainBtn.on('click', async function () {
        const state = stateManager.setState();

        msgChannel<void>('initTraining', {
            trainingSet: state.trainingSet,
            trainingCycles: state.trainingCycles,
            targetError: state.targetError
        }).then(function() {
            console.log('Initiating Training');
        });
    });

    displayNetwork(stateManager, $("#network-visualiser"));
    displayErrorGraph(stateManager, $("#error-graph"));
});
