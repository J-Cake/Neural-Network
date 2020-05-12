import * as $ from 'jquery';

import StateManager from "./stateManager";
import State from "./globState";
import addFeedForwardForm from "./addFeedForwardForm";

export default async function initPreferences(stateManager: StateManager<State>) {
    interface HTMLFormElement_ extends HTMLFormElement {
        trainingSubset: HTMLInputElement,
        learningRate: HTMLInputElement,
        seed: HTMLInputElement,
    }

    const form = $(`body form[name="config"]`);

    const state = stateManager.setState(prev => ({
        neuronConfig: window.localStorage.neuronConfig || prev.neuronConfig,
        trainingCycles: window.localStorage.trainingCycles || prev.trainingCycles,
        trainingSubset: window.localStorage.trainingSubset || prev.trainingSubset,
        targetError: window.localStorage.targetError || prev.targetError,
        learningRate: window.localStorage.learningRate || prev.learningRate,
        userFunctions: window.localStorage.userFunctions || prev.userFunctions
    }));

    if (form) {
        const formDOM: HTMLFormElement_ = form[0] as HTMLFormElement_;

        // prepopulate values from stateManager.
    }

    $("#config-btn").on('click', function () {
        form.toggleClass('visible');
    })

    form.on('submit', function (e) {
        const formDOM: HTMLFormElement_ = form[0] as HTMLFormElement_;

        e.preventDefault();

        form.removeClass("visible");

        // update state based on user preferences.

        stateManager.dispatch('preferenceChange', function (prev: State): Partial<State> {
            return {
                initSeed: formDOM.seed.value || prev.initSeed,
                trainingSubset: isNaN(Number(formDOM.trainingSubset.value) || prev.trainingSubset) ? prev.trainingSubset : Number(formDOM.trainingSubset.value),
                learningRate: isNaN(Number(formDOM.learningRate.value) || prev.learningRate) ? prev.learningRate : Number(formDOM.learningRate.value)
            };
        })

        return false;
    });

    addFeedForwardForm(stateManager);

    form.on('blur', function() {
        form.removeClass("visible");
    });

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
