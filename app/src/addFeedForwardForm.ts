import * as $ from 'jquery';

import StateManager from "./stateManager";
import State from "./globState";
import {fill} from '../nn/utils';

export default function (stateManager: StateManager<State>) {
    const container = $("#feed-forward-prompt");

    const inputNeurons = stateManager.setState().neuronConfig[0];

    const input = function (): HTMLInputElement {
        const input: HTMLInputElement = document.createElement("input") as HTMLInputElement;

        $(input).addClass('input-num').attr('type', 'number');

        return input;
    };

    container.html(`<form class="form">
        <div id="input-container">
              ${fill(inputNeurons, () => input()).join('')}
        </div>
    </form>`);
}
