# Neural-Network
My sixth attempt at a neural network.

There is a library included in the repo - I would not recommend using it in any production scenario.

But you can try it out by cloning the repo and importing the `./dist/lib.js` file.

## Constructor

It exposes a `Network` class as its default export. You can use this to construct networks based on certain parameters you provide in the constructor.


```typescript
new Network(layerSizes: number[], activationFunctions: {f: (x: number) => number, fPrime: (x: number) => number}[], learningRate: number = 0.3, trainingSubset: number = 0);
```

The constructor takes 4 parameters:

* `layerSizes: number[]`: The number of neurons in each layer. This includes the input and output layers. 

  > **Note:** each value in this array must be an integer **greater than** 0

* `activationFunctions: {f: (x: number) => number, fPrime: (x: number) => number}[]`: The activation functions for each layer. The object’s `f` property can be any non-linear activation function where `fPrime` is its derivative.

  > **Note:** As the input layer does no calculation on its inputs (it doesn’t take inputs) there is no need for activation functions in this layer. Resultantly, the activation set (`f` and `fPrime`) are omitted. Do not include a pair of activation functions for the input layer.
  >
  > **Info:** `f` and `fPrime` are stringified on `export()` and reused on `load()` (Neither functions exist yet but are planned for next commit) so should not rely on external variables and are ideally pure functions. 
  >
  > ​	Using properties from the `Math` object is okay as every JS environment has one however other objects and variables cannot be guaranteed.

* `learningRate: number = 0.3`: The learning rate of the network. Default is `0.3` and is optional.

* `trainingSubset: number = 0`: The number of examples to randomly choose from the training set. If `0` is provided, the entire set is used for each training cycle. The default is `0` and is optional.

## The Network

The network can be operated using several functions on the `Network` instance. 

* `evaluate(inputs: number[]): number[]`: Performs a feed-forward step on given `inputs`. 
  -  `inputs: number[]`: The values of the input neurons
  - **Returns: `number: []`**: The activations of the output layer.
* `train(trainingSet: example[], confirm: number | ((error: number) => boolean)): number`
  * `trainingSet: example[]`: A complete list of training examples for the network to train on.
  * `confirm: number | ((error: number) => boolean)`: A function to check error level and determine whether to continue training or a number to train a given amount of times.
  * **Returns: `number`**: The final error of the network after training.

## Other Info

The `lib.js` file also exports an `example` type. It is an alias for

```typescript
{
    inputs: number[], 
	expected: number[] 
}
```

* `inputs: number[]`: A list of input values for each neuron of the `input` layer.

* `expected: number[]`: A list of values expected to be returned from the network.

### Contribution

#### Bugs

You will almost certainly find issues in the code. Please report them and I’ll try to address them as quickly as I can.

#### Code 

Code updates are also welcome. Please let me know if you find an issue and would like to pull some code for it. Any help is welcome.

### 
