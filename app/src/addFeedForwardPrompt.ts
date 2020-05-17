import * as $ from 'jquery';

import StateManager from "./stateManager";
import State from "./globState";
import {fill} from '../nn/utils';
import {previewExample} from "./addExamplePrompt";

export default function (stateManager: StateManager<State>) {
    const inputNeurons = stateManager.setState().neuronConfig[0];

    const container = $("#feed-forward-prompt")

    container.html(`<form class="form">
        <h1>Values to feed forward</h1>
        <div id="input-container">
            ${fill(inputNeurons, () => `<input type="number" class="input-num" min="0" max="1" value="1" placeholder="Input Value"/>`).join('')}
        </div>
            
        <div id="ff-result"></div>
            
        <div class="form-controls">
            <button type="submit" id="ff-btn">Feed Forward</button>
            <input type="button" id="ff-cancel-btn" value="Close"/>
            <input type="button" id="ff-clear-btn" value="Clear History"/>
        </div>
    </form>`);

    console.log(container);

    container.find("#ff-cancel-btn").on('click', function () {
        container.find('form.form').removeClass('visible');
    });

    container.find("#ff-clear-btn").on('click', function() {
        container.find('#ff-result').empty();
    });

    container.children("form").on('submit', async function (e) {
        e.preventDefault();

        const inputs: number[] = container.find('.input-num').map(function () {
            return Number($(this).val());
        }).get();

        const res = await stateManager.setState().msgChannel<number[]>('feedForward', inputs);

        container.find('#ff-result').append(previewExample({
            inputs: inputs,
            expected: res
        }));

        return false;
    });

    $("#eval-btn").on('click', function () {
        container.find('form').toggleClass('visible');
    });
}
