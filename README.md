# ng-form-rules

[![Build Status](https://travis-ci.org/cknightdevelopment/ng-form-rules.svg?branch=master)](https://travis-ci.org/cknightdevelopment/ng-form-rules)

### Form Rule Thoughts 

I care about three things when it comes to form rules:

1. Is the data **valid**?
2. Should the data be **editable**?
3. Should the data be **visible**?

For each of these concerns there are three things I need:

1. Checks
2. Conditions
3. Messaging

In order to run these rules and conditions, I need to be provided the correct data **context**. Does the nested child property need to know about a property on the parent? Do we need to be able to reach into an array? Scenarios include the following:

- Simple type (e.g. `"Joe"`, `30`, etc.)
- Flat object (e.g. `{ name: "Joe", age: 30 }`
- Nested objects (e.g. `{ name: "Joe", age: 30, car: { make: "Subaru", year: 2015, dealership: { name: "Super Subaru" } } }`)
- Arrays (e.g. `[{name: "Joe"}, {name: "Mike"}, {name: "Sarah"}]`
