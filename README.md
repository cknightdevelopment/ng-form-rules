# ng-form-rules

[![Build Status](https://travis-ci.org/cknightdevelopment/ng-form-rules.svg?branch=master)](https://travis-ci.org/cknightdevelopment/ng-form-rules) 
[![Coverage Status](https://coveralls.io/repos/github/cknightdevelopment/ng-form-rules/badge.svg)](https://coveralls.io/github/cknightdevelopment/ng-form-rules)

## Table of Contents

* [Installation](#installation)
* [Dependencies](#deps)
* [What does `ng-form-rules` do?](#do)
* [What does `ng-form-rules` **NOT** do?](#not-do)
* [Getting Started](#getting-started)
* [Documentation](#docs)
* [Examples](#examples)

## <a id="installation"></a> Installation

`npm install ng-form-rules --save`

## <a id="deps"></a> Dependencies

Note: if you are using Angular 6+ these are all installed for you by default. In other words, you are good to go :)

* `@angular/common` version `^6.0.0`
* `@angular/core` version `^6.0.0`
* `tslib` version `^1.9.0`

## <a id="do"></a> What does `ng-form-rules` do?

* Create model settings with rules dictating whether a property is valid and/or editable
    * Rules can be as simple as making a property required or as complex as a multi-logical tree
    * Rules can react to value changes in other properties in the form, whether at the same level, nested, in an array item, or at a parent's level
    * Syncronous and asyncronous rules are allowed, of course
* Generate the Angular form controls (`FormGroup`, `FormArray`, and `FormControl`) to use within your templates
    * All of your rules will automatically be attached to the form. Let us take care of building those forms for you.
* You are never blocked! The form controls we generate are no different than what you have used before in Angular. You can manipulate them, add controls, add validators outside of `ng-form-rules`, etc. No problemo!

## <a id="not-do"></a> What does `ng-form-rules` **NOT** do?

* Anything with styling, display, etc.
* Provide Angular components, directives, pipes, etc. to display on a page
* Provide built-in validation methods (e.g. MaxLength, Required, etc.)

## <a id="getting-started"></a> Getting Started

_TODO_

## <a id="docs"></a> Documentation

* [Wiki][link-wiki]

## <a id="examples"></a> Examples

* [StackBlitz][link-stackblitz] - **Amazing** online IDE to see the examples in action and play around with them
* [Example Repo][link-examples-repo] - Clone the examples to your local machine and take them for a spin


<!-- ### Form Rule Thoughts 

A couple things matter to me concerning form rules:

1. Is the data **valid**?
2. Is the data **editable**?
3. Is the data **visible**?

In order to answer these questions I need a few pieces of functionality:

1. Checks
2. Conditions
3. Messaging

Form data objects come in many varieties:

- Simple type 
```
"Joe"
```
- Flat object 
```
{ name: "Joe", age: 30 }
```
- Nested objects 
```
{ 
  name: "Joe", 
  age: 30, 
  car: { 
    make: "Subaru", 
    year: 2015, 
    dealership: { 
      name: "Super Subaru" 
    } 
  } 
}
```
- Arrays 
```
[
  { name: "Joe" }, 
  { name: "Mike" }, 
  { name: "Sarah" }
]
```

In order to run apply form rules properly I need to be provided the correct data **context**. Does the nested child property need to know about a property on the parent? Do we need to be able to reach into an array? -->


<!-- LINK REFERENCES GO HERE -->
[link-wiki]: https://github.com/cknightdevelopment/ng-form-rules/wiki
[link-stackblitz]: https://stackblitz.com/github/cknightdevelopment/ng-form-rules-examples
[link-examples-repo]: https://github.com/cknightdevelopment/ng-form-rules-examples