import {fill, sig, sigp} from "../nn/utils";

const activations = function (layerSizes: number[]): { f: (x: number) => number, fPrime: (x: number) => number }[] {
    return fill(layerSizes.length - 1, () => ({f: sig, fPrime: sigp}));
};

export default activations;
