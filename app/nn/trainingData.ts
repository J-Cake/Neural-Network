import {example} from "./lib";

const trainingData: example[] = [
    {
        inputs: [0, 0, 0],
        expected: [0]
    },
    {
        inputs: [0, 0, 1],
        expected: [1]
    },
    {
        inputs: [0, 1, 0],
        expected: [1]
    },
    {
        inputs: [0, 1, 1],
        expected: [0]
    },
    {
        inputs: [1, 0, 0],
        expected: [1]
    },
    {
        inputs: [1, 0, 1],
        expected: [0]
    },
    {
        inputs: [1, 1, 0],
        expected: [0]
    }
];

export default trainingData;
