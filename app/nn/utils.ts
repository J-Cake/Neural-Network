export const set = (array: number[], value: number[]): number[] => {
    if (array.length === value.length)
        array.forEach((i, a) => array[a] = value[a]);

    return array;
};

export const fill = <T>(length: number, filler: (i: number, length: number, prev: T) => T): T[] => { // simple array preloading function. Don't worry about it. It works.
    const arr: T[] = [];

    let prev: T = null as any as T;
    for (let i = 0; i < length; i++)
        arr.push(prev = filler(i, length, prev));

    return arr;
};

export const transpose = (matrix: number[][]): number[][] => {
    const output: number[][] = [];

    for (let i = 0; i < matrix[0].length; i++)
        output.push(matrix.map(j => j[i]));

    return output;
}

// the activations array is an array of activations in the current layer.
export const dot = (weights: number[][], activations: number[]): number[] => transpose(activations.map((i, a) => weights.map(j => j[a] * i))).map(i => i.reduce((a, i) => a + i));
export const dotMatrix = (matrixA: number[][], matrixB: number[][]): number[][] => transpose(transpose(matrixB).map(i => dot(matrixA, i)));
export const dotVector = (vectorA: number[], vectorB: number[]): number[][] => vectorA.map(i => vectorB.map(j => j * i));
export const matrixify = (vector: number[]) => vector.map(i => [i]);

// non-linear activation functions
export const sig = (x: number): number => 1 / (1 + Math.E ** -x);

export const sigp = (x: number): number => x * (1 - x);
