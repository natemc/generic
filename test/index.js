'use strict'

const assert = require('assert')
const generic = require('../lib')
const _ = generic._

it("throws an exception when it doesn't match a pattern", function () {
  const futile = generic.create()

  assert.throws(() =>
    futile('Why do I bother?'),
    /No method matches arguments in call to generic function./
  )
})

it("includes the function's name in error messages", function () {
  const futile = generic.create({name: 'futile'})

  assert.throws(() =>
    futile('Why do I bother?'),
    /No method matches arguments in call to generic function 'futile'./
  )
})

it('matches the wildcard character', function () {
  const identity = generic.create()
  identity.method(_, (x) => x)

  assert.equal(identity('Common Lisp'), 'Common Lisp')
})

it('matches and returns values', function () {
  const fibonacci = generic.create()

  fibonacci.method([_], (n) => fibonacci(n - 1) + fibonacci(n - 2))
  fibonacci.method([1], 1)
  fibonacci.method([0], 0)

  assert.equal(fibonacci(13), 233)
})

it('matches with a predicate function', function () {
  const retort = generic.create()

  retort.method((args) => args.length > 2,
    () => "You are argumentative, aren't you?!"
  )

  assert.equal(
    retort('and', 'another', 'thing'),
    "You are argumentative, aren't you?!"
  )
})

it('matches objects', function () {
  const published = generic.create()

  published.method([{
    title: _,
    author: _,
    year: _,
    ISBN: _
  }], (x) => x.year)

  assert(published({
    title: 'Common Lisp the Language, 2nd edition',
    author: 'Guy L. Steele',
    year: 1990,
    ISBN: '1-55558-041-6'
  }), 1990)
})

it('fails to match when objects are different lengths', function () {
  const head = generic.create()
  head.method([_], x => x)

  assert.throws(() =>
    head(1, 2),
    /No method matches arguments in call to generic function./
  )
})

it('matches with nested predicate functions', function () {
  const isArray = (x) => x instanceof Array
  const isNumber = (x) => typeof x === 'number'

  const sum = generic.create()
  sum.method([isNumber, isNumber], (x, y) => x + y)
  sum.method([isArray, isArray], (x, y) => x.concat(y))

  assert.equal(sum(1, 2), 3)
  assert.deepEqual(sum([1], [2]), [1, 2])
})

it('matches deeply nested structures', function () {
  const fullName = generic.create()

  fullName.method(['history', {
    name: _,
    predecessor: {
      name: _,
      predecessor: {
        name: 'Lisp',
        author: (name) => name.split(' ').length > 1
      }
    }
  }], (type, lineage) => lineage.predecessor.predecessor.author)

  assert.equal(fullName('history', {
    name: 'ANSI Common Lisp',
    predecessor: {
      name: 'Common Lisp',
      predecessor: {
        name: 'Lisp',
        author: 'John McCarthy'
      }
    }
  }), 'John McCarthy')

  assert.throws(() =>
    fullName('history', {
      name: 'ANSI Common Lisp',
      predecessor: {
        name: 'Common Lisp',
        predecessor: {
          name: 'Lisp',
          author: 'John'
        }
      }
    }),
    /No method matches arguments./
  )
})

it('optionally curries generic functions', function () {
  const map = generic.create({curry: 2})

  map.method([x => typeof x === 'function', x => x instanceof Array],
    (callback, array) =>
      array.map(callback)
  )

  const doubleElements = map(x => 2 * x)

  assert.deepEqual(doubleElements([1, 2, 3]), [2, 4, 6])
})
