import * as $ from 'jquery';

import displayNetwork from "./NeuralNet";
import displayErrorGraph from "./error";
import StateManager from "./stateManager";
import globState from "./globState";
import workerChannel, {state} from "./msgChannel";
import MockNetwork from "./mockNetwork";
import trainingData from "../nn/trainingData";
import initPreferences from "./ui";
import {fill} from '../nn/utils';
import initTraining from "../worker/initTraining";
import exampleFn, {addExample} from "./addExamplePrompt";

interface w extends Window {
    init?: () => Promise<void>,
    hasExecuted?: boolean
}

const w: w = window as w;

w.init = async function () {
    if (!w.hasExecuted) {
        w.hasExecuted = true;

        const stateManager: StateManager<globState> = new StateManager<globState>({
            neuronConfig: [3, 4, 1],
            learningRate: 0.3,
            trainingSubset: 0,
            trainingCycles: 1e4,
            trainingSet: trainingData,
            targetError: 3.5e-3,
            error: [],
            userFunctions: {
                Sigmoid: {
                    f: `x => 1 / (1 + Math.E ** -x)`,
                    fPrime: `x => x * (1 - x)`
                }
            },
            activationFunctions: fill(2, () => 'Sigmoid'),
            graphColour: {
                red: 0,
                green: 120,
                blue: 215
            },
            addExample: addExample,
            onTrainFnc: async function () {
                const state = stateManager.setState({
                    graphColour: {
                        red: 0,
                        green: 180,
                        blue: 100
                    }
                });

                console.log("TRAINING SET", state.trainingSet);

                if (!state.isTraining) {
                    stateManager.dispatch("beginTraining", prev => ({
                        elapsedTrainingTime: prev.elapsedTrainingTime || 0,
                        trainingStart: new Date()
                    }));
                    state.msgChannel<number>('initTraining', {
                        trainingSet: state.trainingSet,
                        trainingCycles: state.trainingCycles,
                        targetError: state.targetError
                    }).then((data: number) => {
                        stateManager.dispatch('endTraining', prev => ({
                            graphColour: {
                                red: 0,
                                green: 120,
                                blue: 215
                            }
                        }))
                    });
                }
            }
        });

        initPreferences(stateManager);
        displayNetwork(stateManager, $("#network-visualiser"));
        displayErrorGraph(stateManager, $("#error-graph"));

        stateManager.setState(function (): Partial<globState> {
            const worker: Worker = new Worker('./worker.js');

            const trainingUpdate = function (data: { error: number[], network: MockNetwork, minError: number, maxError: number, training: boolean }) {
                console.log("training", data.training);
                console.log('min:', data.minError, 'max:', data.maxError);

                stateManager.setState(prev => ({
                    network: data.network || prev.network,
                    error: data.error || prev.error,
                    minError: data.minError,
                    maxError: data.maxError,
                    isTraining: data.training
                }));
            };

            const msgChannelStateMgr: StateManager<state> = new StateManager<state>({
                msgTarget: worker.postMessage.bind(worker),
                procName: 'Main',
                functions: [],
                requests: [],
                requestHandlers: {
                    trainingUpdate: trainingUpdate,
                    trainingStart: trainingUpdate,
                    trainingStop: trainingUpdate
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

        const create = function (): void {
            const {msgChannel, neuronConfig, learningRate, trainingSubset, userFunctions, activationFunctions, initSeed} = stateManager.setState({
                error: []
            });

            if (msgChannel)
                msgChannel<MockNetwork>('createNetwork', {
                    neuronConfig: neuronConfig,
                    learningRate: learningRate,
                    trainingSubset: trainingSubset,
                    userFunctions: userFunctions,
                    activationFunctions: activationFunctions,
                    initSeed: initSeed,
                }).then((network: MockNetwork) => {
                    console.log(network);
                    stateManager.setState({
                        network: network,
                        error: [],
                    });
                });

            stateManager.on('preferenceChange', function (state) {
                window.localStorage.trainingCycles = state.trainingCycles;
                window.localStorage.trainingSubset = state.trainingSubset;
                window.localStorage.targetError = state.targetError;
                window.localStorage.learningRate = state.learningRate;
                window.localStorage.initSeed = state.initSeed || "";

                create();
            });
        }

        create();
        exampleFn(stateManager);

        const trainBtn = $('#train-btn');
        trainBtn.on('click', stateManager.setState().onTrainFnc);
    }
}

window.addEventListener("load", w.init);
// A Good Seed to use is HN2Vp1MO
