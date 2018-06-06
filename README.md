# ng-form-rules

[![Build Status](https://travis-ci.org/cknightdevelopment/ng-form-rules.svg?branch=master)](https://travis-ci.org/cknightdevelopment/ng-form-rules) 
[![Coverage Status](https://coveralls.io/repos/github/cknightdevelopment/ng-form-rules/badge.svg)](https://coveralls.io/github/cknightdevelopment/ng-form-rules)

### Form Rule Thoughts 

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

In order to run apply form rules properly I need to be provided the correct data **context**. Does the nested child property need to know about a property on the parent? Do we need to be able to reach into an array? 


