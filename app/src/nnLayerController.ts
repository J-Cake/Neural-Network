import * as $ from 'jquery';
import State from "./globState";
import StateManager from "./stateManager";
import {fill} from '../nn/utils';
import promptFunction from "./functionPrompt";

export default function configurePrompt(stateManager: StateManager<State>) {
    stateManager.on('NNConfigPromptToggle', function () {
        const state = stateManager.setState();

        const addOption = `Add Function`;

        const fillFunctions = () => [...Object.keys(state.userFunctions), addOption].map(i => `<option>${i}</option>`).join('');

        const neuronConfig = [...state.neuronConfig];

        const chevronUp = $("#chevron-up").html(),
            chevronDown = $("#chevron-down").html()

        const promptTemplate = () => `<form class="form visible">
            <h3>Configure The Neural Network</h3>
            <div id="layer-config">
                ${neuronConfig.map((i, a) => i < 5 ? `<div class="layer-config-layer">
                    <button type="button" data-index="${a}" class="more-neurons">${chevronUp}</button>
                    <div data-index="${a}" class="layer-neurons">${i <= 25 ? fill(i, () => `<div class="neuron"></div>`).join('') : `<span class="overflow-indicator">${i}</span>`}</div>
                    <select class="layer-activation-function ${a <= 0 ? "invisible" : ""}">${a <= 0 ? "" : fillFunctions()}</select>
                    <button type="button" data-index="${a}" class="less-neurons">${chevronDown}</button>
                </div>` : `<div class="layer-config-layer">
                    <input type="number" min="1" class="input-num" value="${i}" data-index="${a}"/>
                    <div class="layer-neurons">${i <= 25 ? fill(i, () => `<div class="neuron"></div>`).join('') : `<span class="overflow-indicator">${i}</span>`}</div>
                    <select class="layer-activation-function ${a <= 0 ? "invisible" : ""}">${a <= 0 ? "" : fillFunctions()}</select>
                    <button type="button" data-index="${a}" class="auto" ${(a <= 0 || a >= neuronConfig.length - 1) ? "disabled" : ""}>Auto</button>
                </div>`).join('')}
                <button id="add-layer" type="button">
                    ${$("#plus").html()}
                </button>
            </div>
        
            <div class="form-controls">
                <button type="submit" name="save-btn">Okay</button>
                <input type="button" name="cancel-btn" value="Cancel" id="config-cancel-btn"/>
            </div>
        </form>`;

        const promptContainer: JQuery = $("#nn-layer-config-prompt");
        promptContainer.empty();
        promptContainer.html(promptTemplate());

        const addClickListeners = function () {
            const refresh = () => {
                promptContainer.html(promptTemplate());
                addClickListeners();
            };

            const prompt = promptContainer.find('form.form');

            prompt.find('#layer-config');

            prompt.find("button.more-neurons").on('click', function () {
                neuronConfig[Number($(this).data('index'))]++;
                refresh();
            });
            prompt.find("button.less-neurons").on('click', function () {
                const index = Number($(this).data('index'));
                neuronConfig[index] = Math.max(1, neuronConfig[index] - 1);
                refresh();
            });
            prompt.find('.layer-config-layer input[type="number"]').on('change', function () {
                const index = Number($(this).data('index'));

                neuronConfig[index] = Number($(this).val());

                refresh();
            });
            prompt.find('.auto').on('click', function () {
                const index = Number($(this).data('index'));

                if (index > 0 && index <= neuronConfig.length - 1)
                    neuronConfig[index] = Math.ceil((neuronConfig[index - 1] * neuronConfig[index + 1]) ** 0.5);
                else
                    console.log("Cannot adjust layer", index);

                refresh();
            });
            prompt.find("#add-layer").on('click', function() {
                neuronConfig.push(3); // arbitrary value

                refresh();
            });
            prompt.find(".layer-neurons").on('click', function() {
                const index = Number($(this).data('index'));

                neuronConfig.splice(index, 1);

                refresh();
            });

            prompt.find('select').on('change', async function () {
                const select: JQuery = $(this);
                if (select.val() === addOption)
                    promptFunction(promptContainer).then(function (activation) {
                        stateManager.setState(prev => ({userFunctions: {...prev.userFunctions, ...activation}}));

                        promptContainer.find("select").html(fillFunctions());

                        select.val(Object.keys(activation)[0]);
                    }).catch(function (err) {
                        console.error(err);
                        select.val('Sigmoid');
                    });
            });

            prompt.on('submit', function (e) {
                e.preventDefault();

                const activationFunctions: string[] = $(".layer-config-layer select:visible:not(.invisible)").map(function () {
                    return String($(this).val())
                }).get();

                console.log(activationFunctions);

                if ((neuronConfig.map(i => !isNaN(i) && isFinite(i) && i > 0)) && activationFunctions.map(i => i in state.userFunctions)) {
                    stateManager.dispatch("preferenceChange", {
                        neuronConfig,
                        activationFunctions
                    });
                    promptContainer.empty();
                }

                return false;
            });

            prompt.find('#config-cancel-btn').on('click', function () {
                promptContainer.empty();
            })
        }

        addClickListeners();
    });
}
