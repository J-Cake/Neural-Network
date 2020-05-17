import * as _p5 from 'p5';

import StateManager from './stateManager';
import State from "./globState";

import {fill} from "../nn/utils";
import drawToolTip, {p5} from "./drawToolTip";

export default async function displayErrorGraph(stateManager: StateManager<State>, parent: JQuery) {
    new _p5(function (sketch: p5) {

        sketch.setup = async function () {
            const canvas = sketch.createCanvas(parent.width() || 180, parent.height() || 70);

            canvas.parent(parent.attr('id') || "error-graph");

            sketch.totalDialogHeight = 0;
        };

        sketch.draw = async function () {
            sketch.smooth();

            const colour = parent.css('background-color');

            if (colour)
                sketch.background(colour);
            else
                sketch.background(255);

            const strokeWeight = 3;

            const state = stateManager.setState(prev => ({
                graphIntervals: prev.graphIntervals || 6,
                errorZoomLevel: prev.errorZoomLevel || 1,
                errorScrollLevel: prev.errorScrollLevel || 0,
                errorUseDifferential: prev.errorUseDifferential || false
            }));

            const _initErrors: number[] = state.error.filter(i => !isNaN(i));
            const visibleAmount: number = Math.ceil(_initErrors.length / state.errorZoomLevel || 1);
            const pos = sketch.constrain(state.errorScrollLevel, 0, _initErrors.length - visibleAmount);

            const errors: number[] = _initErrors.slice(pos, pos + visibleAmount);

            const graphColour = state.graphColour;
            const minError = state.maxError;
            const maxError = state.minError; // invert the axes

            const fitToScreenX: (x: number) => number = (x: number) => sketch.map(x, 0, errors.length, 0, sketch.width);
            const fitToScreenY: (y: number) => number = (y: number) => sketch.map(y, minError, maxError, 25, sketch.height - 25);

            if (_initErrors.length > 0 && !state.isTraining) {
                sketch.textSize(11);
                sketch.textAlign(sketch.LEFT);

                // sketch.noFill();
                sketch.strokeWeight(strokeWeight);
                sketch.stroke(graphColour.red, graphColour.green, graphColour.blue);
                sketch.fill(graphColour.red, graphColour.green, graphColour.blue, 50);

                sketch.beginShape();
                sketch.vertex(-strokeWeight, fitToScreenY(0));
                sketch.vertex(-strokeWeight, fitToScreenY(errors[0]));

                errors.forEach(function (i, a) {
                    sketch.vertex(fitToScreenX(a), fitToScreenY(i));
                });

                sketch.vertex(sketch.width + strokeWeight, fitToScreenY(errors[errors.length - 1]));
                sketch.vertex(sketch.width + strokeWeight, fitToScreenY(0));

                sketch.endShape();

                const intervals = stateManager.setState().graphIntervals;

                const drawLineForInterval: (i: number) => void = function (i: number) {
                    if (minError && maxError) {
                        const errorValue = sketch.map(i, 0, intervals - 1, minError, maxError);
                        const _height: number = fitToScreenY(errorValue);

                        if (errorValue && _height) {
                            sketch.noStroke();
                            sketch.fill(180, 180, 180);
                            sketch.text(errorValue, 2, _height - 2);

                            sketch.noFill();
                            sketch.stroke(180, 180, 180, 75);

                            sketch.line(0, _height, sketch.width, _height);
                        }
                    }
                }

                void fill(intervals, function (a) { // dereference the outputted `undefined[]`.
                    sketch.strokeWeight(1);

                    drawLineForInterval(a);
                });

                sketch.strokeWeight(2);
                sketch.stroke(180, 180, 180);
                sketch.line(0, fitToScreenY(0), sketch.width, fitToScreenY(0));
                sketch.strokeWeight(1);

                // not a scroll bar, just an indicator
                const indicatorHeight = 16;
                sketch.fill("rgba(50,146,248,0.33)");
                sketch.rect(0, 0, sketch.width, indicatorHeight);
                const width = sketch.map(visibleAmount, 0, _initErrors.length, 0, sketch.width);
                const offset = sketch.map(pos, 0, _initErrors.length, 0, sketch.width);
                sketch.rect(offset, 0, width, indicatorHeight);

                // Info Boxes
                if (minError && maxError) {
                    if (sketch.mouseX >= 0 && sketch.mouseX <= sketch.width && sketch.mouseY >= 0 && sketch.mouseY <= sketch.height) {
                        sketch.stroke("#f85d1f");
                        sketch.line(sketch.mouseX, indicatorHeight, sketch.mouseX, sketch.height + strokeWeight);
                        const cursorPos = offset + sketch.map(sketch.mouseX, 0, sketch.width, 0, width);
                        sketch.line(cursorPos, 0, cursorPos, indicatorHeight);

                        drawToolTip(String(errors[Math.floor(sketch.map(sketch.mouseX, 0, sketch.width, 0, errors.length))] || ''), sketch, parent.css('background-color'));
                    }
                }
            } else {
                const string: string = state.isTraining ? 'Training In Progress' : 'The error levels of the network will be displayed once training has finished here.';
                const textSize = sketch.width / string.length;

                sketch.fill(180, 180, 180);
                sketch.noStroke();
                sketch.textSize(textSize);
                sketch.textAlign(sketch.CENTER);
                sketch.text(string, sketch.width / 2, sketch.height / 2);
            }

            sketch.totalDialogHeight = 0;
        }

        window.addEventListener("resize", async function () {
            sketch.resizeCanvas(parent.width() || 180, parent.height() || 70);
        });
    }, parent[0]);
}
