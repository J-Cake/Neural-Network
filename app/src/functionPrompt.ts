import * as $ from 'jquery';
import convertToFunctions, {funcStrings} from "../worker/convertToFunctions";

export default function promptFunction(parent: JQuery): Promise<funcStrings> {
    return new Promise(function (resolve, reject) {
        const promptTemplate = `<form class="form visible">
            <div id="function-prompt">
                <input type="text" id="function-name" placeholder="Function Identifier"/>
    
                <label>Enter a function following the signature <code>(x: number) => number</code></label>
                <textarea id="function-f"></textarea>
                <label>Enter the above function's derivative, following the signature <code>(x: number) => number</code></label>
                <textarea id="function-f-prime"></textarea>
            </div>
            
            <div class="form-controls">
                <button type="submit">Okay</button>
                <input type="button" value="Cancel" id="function-cancel-btn"/>      
            </div>
        </form>`;

        const functionPrompt: JQuery = $(document.createElement("section"));

        functionPrompt.attr('id', 'function-prompt');

        functionPrompt.html(promptTemplate);

        functionPrompt.on('submit', function (e) {
            e.preventDefault();

            const funcName = functionPrompt.find("#function-name").val();
            const f = functionPrompt.find('#function-f').val();
            const fPrime = functionPrompt.find('#function-f-prime').val();

            if (typeof funcName === "string")
                if (typeof f === "string" && typeof fPrime === "string")
                    try {
                        convertToFunctions({
                            [funcName]: {
                                f: f,
                                fPrime: fPrime
                            }
                        }, [funcName]);

                        resolve({
                            [funcName]: {
                                f,
                                fPrime
                            }
                        });

                        functionPrompt.empty();
                    } catch (err) {
                        reject(`Invalid Functions`);
                    }
                else
                    reject(`Invalid Functions`);
            else
                reject(`Invalid Name`);

            return false;
        });

        functionPrompt.find('#function-cancel-btn').on('click', function () {
            reject('Cancelled');
            functionPrompt.empty()
        });

        parent.append(functionPrompt);
    });
}
