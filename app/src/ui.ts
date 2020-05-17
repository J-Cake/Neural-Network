import * as $ from 'jquery';

import StateManager from "./stateManager";
import State from "./globState";
import addFeedForwardForm from "./addFeedForwardPrompt";
import configurePrompt from "./nnLayerController";

export default async function initPreferences(stateManager: StateManager<State>) {
    interface HTMLFormElement_ extends HTMLFormElement {
        trainingSubset: HTMLInputElement,
        learningRate: HTMLInputElement,
        seed: HTMLInputElement,
    }

    stateManager.onStateChange(function (state: State) {
        if (state.isTraining && !(state.elapsedTimer !== 0))
            stateManager.setState({
                elapsedTimer: state.elapsedTimer || window.setInterval(function () {
                    const startTime = stateManager.setState().trainingStart;

                    const diff = new Date(new Date().getTime() - startTime.getTime());


                    $("#elapsed-training-time").text(`${String(diff.getUTCHours()).padStart(3, '0')}:${String(diff.getUTCMinutes()).padStart(2, '0')}:${String(diff.getUTCSeconds()).padStart(2, '0')}`);
                }, 100)
            });
        else if (!state.isTraining && state.elapsedTimer !== 0) {
            clearInterval(stateManager.setState().elapsedTimer);
            stateManager.setState(prev => ({
                elapsedTimer: 0,
                // elapsedTrainingTime: new Date(new Date().getTime() - prev.trainingStart.getTime() + state.elapsedTrainingTime).getTime()
            }))
        }
    });

    const form = $(`body form[name="config"]`);

    const state = stateManager.setState(prev => ({
        neuronConfig: window.localStorage.neuronConfig || prev.neuronConfig,
        userFunctions: window.localStorage.userFunctions || prev.userFunctions,

        trainingCycles: Number(window.localStorage.trainingCycles || prev.trainingCycles),
        trainingSubset: Number(window.localStorage.trainingSubset || prev.trainingSubset),
        targetError: Number(window.localStorage.targetError || prev.targetError),
        learningRate: Number(window.localStorage.learningRate || prev.learningRate),
        initSeed: window.localStorage.initSeed || prev.initSeed || ""
    }));

    configurePrompt(stateManager);

    form.find('#configure-layers-btn').on('click', function() {
        stateManager.broadcast("NNConfigPromptToggle");
    });

    if (form) {
        const {trainingCycles, trainingSubset, targetError, learningRate, initSeed} = stateManager.setState();
        form.find('#use-subset').val(trainingSubset);
        form.find('#learning-rate').val(learningRate);
        form.find('#target-error').val(targetError);
        form.find('#rtp-num').val(trainingCycles);
        form.find('#init-seed').val(initSeed);
    }

    $("#config-btn").on('click', function () {
        form.toggleClass('visible');
    });

    form.find("#config-reset-btn").on('click', function () {
        stateManager.dispatch('preferenceChange', {});
        form.removeClass("visible");
    });

    form.on('submit', function (e) {
        const formDOM: HTMLFormElement_ = form[0] as HTMLFormElement_;

        e.preventDefault();

        form.removeClass("visible");

        stateManager.dispatch('preferenceChange', function (prev: State): Partial<State> {
            return {
                initSeed: formDOM.seed.value || prev.initSeed || "",
                trainingSubset: isNaN(Number(formDOM.trainingSubset.value) || prev.trainingSubset) ? prev.trainingSubset : Number(formDOM.trainingSubset.value),
                learningRate: isNaN(Number(formDOM.learningRate.value) || prev.learningRate) ? prev.learningRate : Number(formDOM.learningRate.value)
            };
        })

        return false;
    });

    addFeedForwardForm(stateManager);

    $("#config-cancel-btn").on('click', function () {
        form.removeClass("visible");
    });

    $('#spacing-controls #plus').on('click', function () {
        stateManager.setState(prev => ({
            graphIntervals: Math.min(prev.graphIntervals + 1, 20)
        }))
    });

    $('#spacing-controls #minus').on('click', function () {
        stateManager.setState(prev => ({
            graphIntervals: Math.max(prev.graphIntervals - 1, 1)
        }))
    });

    $('#zoom-controls #in').on('click', function () {
        stateManager.setState(prev => ({
            errorZoomLevel: Math.min((prev.errorZoomLevel || 1) * 1.25, 25)
        }))
    });

    $('#zoom-controls #out').on('click', function () {
        stateManager.setState(prev => ({
            errorZoomLevel: Math.max((prev.errorZoomLevel || 1) / 1.25, 1)
        }))
    });

    $('#scroll-controls #left').on('click', function () {
        console.log('left');
        stateManager.setState(prev => ({
            errorScrollLevel: Math.max(prev.errorScrollLevel - Math.ceil(prev.error.length / prev.errorZoomLevel || 1), 0)
        }))
    });

    $('#scroll-controls #right').on('click', function () {
        console.log('right');
        stateManager.setState(prev => ({
            errorScrollLevel: Math.min(prev.errorScrollLevel + Math.ceil(prev.error.length / prev.errorZoomLevel || 1), prev.error.length)
        }))
    });
}
