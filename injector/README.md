# @sailplane/injector - Type-safe Dependency Injection

## What?

Simple, light-weight, lazy-instantiating, and type-safe dependency injection in Typescript!
Perfect for use in Lambdas and unit test friendly.

This is part of the [sailplane](https://github.com/onicagroup/sailplane) library of
utilities for AWS Serverless in Node.js.

# Why?
It is built on top of the [BottleJS](https://www.npmjs.com/package/bottlejs), with a simple type-safe
wrapper. The original _bottle_ is available for more advanced use, though. Even if you are not using Typescript,
you may still prefer this simplified interface over using BottleJS directly.

## How?
See the [doc site](https://docs.onica.com/projects/sailplane) for usage and examples.

There's also a small working example of Injector in the `example` directory.
It includes [Serverless Framework](https://serverless.com/), [Webpack](https://webpack.js.org/), and @sailplane/lambda-utils.
