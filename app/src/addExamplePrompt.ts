import * as $ from 'jquery';
import StateManager from "./stateManager";
import State from "./globState";
import {example} from "../nn/lib";
import {fill} from "../nn/utils";

export default function exampleFn(stateManager: StateManager<State>) {
    const showExamples = function (examples: example[]) {
        let exampleList: JQuery = $("#data-container");
        exampleList.empty();

        examples.forEach((example, a) => {
            const previewExampleElement = $(previewExample(example));
            previewExampleElement.on('click', async function () {  // add click listener
                const value = await stateManager.setState().addExample($("#add-example-prompt"), stateManager, example);

                if (value)
                    stateManager.dispatch("updateExample", prev => ({
                        trainingSet: [...prev.trainingSet.slice(0, a), value, ...prev.trainingSet.slice(a + 1)]
                    }));
                else
                    stateManager.dispatch("updateExample", prev => ({
                        trainingSet: [...prev.trainingSet.slice(0, a), ...prev.trainingSet.slice(a + 1)]
                    }));
            });
            exampleList.append(previewExampleElement);
        });
    };

    stateManager.on('updateExample', (state: State) => showExamples(state.trainingSet));

    $("#clear-btn").on('click', async function() {
        stateManager.dispatch('updateExample', prev => ({
            trainingSet: []
        }));
    })
    $("#add-example-btn").on('click', async function () {
        const example: example = await stateManager.setState().addExample($("#add-example-prompt"), stateManager);

        stateManager.dispatch('updateExample', prev => ({
            trainingSet: [...prev.trainingSet, example]
        }));
    });

    showExamples(stateManager.setState().trainingSet);
}

export function previewExample(example: example): JQuery {
    const div = document.createElement('div');

    $(div).html(`<div class="example">
        <div class="example-inputs">${example.inputs.map(i => `<span class="value">${i}</span>`).join('')}</div>
        <div class="example-expected">${example.expected.map(i => `<span class="value">${i}</span>`).join('')}</div>
    </div>`);

    return $(div).children(".example");
}

export function addExample(parent: JQuery, stateManager: StateManager<State>, preload?: example): Promise<example> {
    return new Promise(function (resolve) {
        const neuronConfig: number[] = stateManager.setState().neuronConfig;

        const inputBoxes: HTMLInputElement[] = fill(neuronConfig[0], function (a: number): HTMLInputElement {
            const input: HTMLInputElement = document.createElement('input') as HTMLInputElement;
            input.classList.add('input-num');
            input.min = "0";
            input.max = "1";
            input.type = 'number';
            input.value = String(preload ? preload.inputs[a] : 1);
            input.step = '0.01';

            return input;
        });
        const outputBoxes: HTMLInputElement[] = fill(neuronConfig[neuronConfig.length - 1], function (a: number): HTMLInputElement {
            const input: HTMLInputElement = document.createElement('input') as HTMLInputElement;
            input.classList.add('expected-num');
            input.min = "0";
            input.max = "1";
            input.type = 'number';
            input.value = String(preload ? preload.expected[a] : 1);
            input.step = '0.01';

            return input;
        });

        const container = document.createElement('form');
        container.id = container.name = 'example-form';
        container.classList.add('form');

        $(container).on('blur', function() {
            parent.empty();
        });

        const heading: HTMLParagraphElement = document.createElement("p");
        $(heading).text('Define an example to use during training');

        container.appendChild(heading);
        container.addEventListener('submit', function (e) {
            e.preventDefault();

            const example: example = {
                inputs: inputBoxes.map(i => Number($(i).val())),
                expected: outputBoxes.map(i => Number($(i).val()))
            };

            resolve(example);

            parent.empty();

            return false;
        });

        const inputs: HTMLDivElement = document.createElement('div');
        const inputLabel = document.createElement('span');
        $(inputLabel).text("Inputs");
        inputs.appendChild(inputLabel);
        inputs.id = 'input-values';
        inputBoxes.forEach(i => inputs.appendChild(i));

        const outputs: HTMLDivElement = document.createElement('div');
        const outputLabel = document.createElement('span');
        $(outputLabel).text("Expected Outputs");
        outputs.appendChild(outputLabel);
        outputs.id = 'expected-values';
        outputBoxes.forEach(i => outputs.appendChild(i));

        container.appendChild(inputs);
        container.appendChild(outputs);

        const btnContainer: HTMLDivElement = document.createElement('div');
        btnContainer.id = "okay-btn-container"
        btnContainer.classList.add('form-controls');

        const okayBtn: HTMLButtonElement = document.createElement('button');
        okayBtn.type = 'submit';
        $(okayBtn).text(preload ? "Update" : "Add");
        const cancelBtn: HTMLInputElement = document.createElement('input');
        cancelBtn.type = 'button';
        $(cancelBtn).val("Cancel");

        $(cancelBtn).on('click', function () {
            parent.empty();
        });

        btnContainer.appendChild(okayBtn);
        btnContainer.appendChild(cancelBtn);

        if (preload) {
            const deleteBtn: HTMLInputElement = document.createElement('input');
            deleteBtn.type = 'button';
            $(deleteBtn).val("Remove");

            $(deleteBtn).on('click', function () {
                resolve(null as any as example);
                parent.empty();
            });

            btnContainer.appendChild(deleteBtn);
        }

        container.appendChild(btnContainer);

        parent.empty();
        parent.append(container);
    });
}
