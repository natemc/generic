'use strict'

const R = require('ramda')
const _ = () => true

const matchObjects = (pattern, value) => {
  const patternKeys = Object.keys(pattern)
  const valueKeys = Object.keys(value)

  return patternKeys.length === valueKeys.length
    ? patternKeys.every((key) => match(pattern[key], value[key]))
    : false
}

const match = (pattern, value) =>
  // If the pattern is a function then use it as a predicate.
  ((typeof pattern === 'function')
    ? pattern(value) === true
    // Check for equality.
    : (pattern === value) ||
      // If both are Objects then check their properties.
      ((pattern instanceof Object) && (value instanceof Object) &&
        matchObjects(pattern, value)
      )
  )

const create = (options) => {
  const methods = []

  const dispatch = function () {
    // Try each method, starting with the last one defined.
    for (let index = methods.length - 1; index >= 0; index--) {
      const method = methods[index]

      if (match(method.pattern, arguments)) {
        const implementation = method.implementation

        return R.is(Function, implementation)
          ? implementation.apply(null, arguments)
          : implementation
      }
    }

    const argumentsLength = arguments.length

    const argumentsCount = argumentsLength === 1
      ? 'single argument'
      : `${argumentsLength} arguments`

    const name = options && options.name

    const nameString = name
      ? " '" + name + "'"
      : ''

    throw new ReferenceError(
      `No method matches ${argumentsCount} in call to generic function${nameString}.`
    )
  }

  const curried = options && options.curry
    ? R.curryN(options.curry, dispatch)
    : dispatch

  curried.method = (pattern, implementation) => {
    methods.push({pattern, implementation})
  }

  return curried
}

module.exports = {
  _,
  create,
  match
}
