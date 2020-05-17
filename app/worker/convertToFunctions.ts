export type funcStrings = { [name: string]: { f: string, fPrime: string } }

export default function (funcStrings: funcStrings, activationFunctions: (keyof funcStrings)[]): { f: (x: number) => number, fPrime: (x: number) => number }[] {
    const functions: {
        [name: string]: { f: (x: number) => number, fPrime: (x: number) => number }
    } = {};

    for (const func in funcStrings) {
        const i = funcStrings[func];
        const funcs: { f: (x: number) => number, fPrime: (x: number) => number } =
            new Function(`return {f: ${i.f}, fPrime: ${i.fPrime}};`)() as { f: (x: number) => number, fPrime: (x: number) => number };

        let r_f, r_fPrime;

        try {
            // Test each function to make sure each accepts only one argument.
            r_f = funcs.f(0);
            r_fPrime = funcs.fPrime(0);

            functions[func] = ({f: funcs.f, fPrime: funcs.fPrime});
        } catch (err) {
            throw new TypeError(`Activation functions cannot rely on outside information that wasn't explicitly given to them.`);
        }

        if (isNaN(r_f))
            throw new TypeError(`Function '${i.f}' returns NaN`);
        else if (isNaN(r_fPrime))
            throw new TypeError(`Function '${i.fPrime}' returns NaN`);
    }

    return activationFunctions.map(i => functions[i]);
}
