import * as _p5 from 'p5';

import StateManager from './stateManager';
import State from "./globState";

export default function displayErrorGraph(stateManager: StateManager<State>, parent: JQuery) {
    new _p5(function (sketch: _p5) {

        const errors: Set<number> = new Set();

        sketch.setup = function() {
            const canvas = sketch.createCanvas(parent.width() || 180, parent.height() || 70);

            canvas.parent(parent.attr('id') || "error-graph");

            stateManager.on('initTraining', function () {
                stateManager.setState({
                    onTrainData: function (info: { error: number; iterations: number }): boolean {
                        errors.add(info.error);

                        const {haltTraining, trainingCycles} = stateManager.setState();

                        if (haltTraining)
                            return false;
                        else
                            if (trainingCycles)
                                return info.iterations < trainingCycles;
                            else
                                return true;
                    }
                });
            });
        };

        sketch.draw = function() {
            sketch.smooth();

            const colour = parent.css('background-color');

            if (colour)
                sketch.background(colour);
            else
                sketch.background(255);

            for (const error of errors) {

            }
        }

        window.addEventListener("resize", function() {
            sketch.resizeCanvas(parent.width() || 180, parent.height() || 70);
        });
    }, parent[0]);
}
