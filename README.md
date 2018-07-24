# ng-form-rules

[![Build Status](https://travis-ci.org/cknightdevelopment/ng-form-rules.svg?branch=master)](https://travis-ci.org/cknightdevelopment/ng-form-rules) 
[![Coverage Status](https://coveralls.io/repos/github/cknightdevelopment/ng-form-rules/badge.svg)](https://coveralls.io/github/cknightdevelopment/ng-form-rules) 
[![Join the chat at https://gitter.im/ng-form-rules/Lobby](https://badges.gitter.im/ng-form-rules/Lobby.svg)](https://gitter.im/ng-form-rules/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Simple, powerful, and customizable rule engine library for Angular reactive forms.

## Table of Contents

* [Installation](#installation)
* [Dependencies](#deps)
* [What does `ng-form-rules` do?](#do)
* [What does `ng-form-rules` **NOT** do?](#not-do)
* [Getting Started](#getting-started)
* [Documentation](#docs)
* [Examples](#examples)
* [License](#license)

## <a id="installation"></a>Installation

`npm install ng-form-rules`

## <a id="deps"></a>Dependencies

:information_source: If you are using Angular 6+ these are installed by default. In other words, you are good to go :)

* `@angular/common` version `^6.0.0`
* `@angular/core` version `^6.0.0`
* `tslib` version `^1.9.0`

## <a id="do"></a>What does `ng-form-rules` do?

* Create model settings with rules dictating whether properties are valid and/or editable
    * Rules can be as simple or complex as you want; you have full control
    * Rules can react to changes in other properties, whether at the same level, nested, in an array item, or at a parent's level
    * Synchronous and asynchronous rules are allowed
* Generate Angular form controls (`FormGroup`, `FormArray`, and `FormControl`) based upon your model settings to use within your templates
    * All of the rules in your model settings will automatically be attached to the form.
* You are never blocked! The form controls we generate are no different than what you already use in Angular. You can manipulate them, add controls, add validators from outside `ng-form-rules`, etc.

## <a id="not-do"></a>What does `ng-form-rules` **NOT** do?

* Anything with styling, display, etc.
* Provide Angular components, directives, pipes, etc. to display on a page
* Provide a library of validation methods (e.g. MaxLength, Required, etc.)

## <a id="getting-started"></a>Getting Started

[View example in action][sb-getting-started]

To use `ng-form-rules` in your app you need to import the `FormRulesModule` into one of your Angular modules (most likely the main `AppModule`).

```typescript
import { FormRulesModule } from 'ng-form-rules';
// other imports...

@NgModule({
  imports: [
    BrowserModule,       // from Angular, but required to use reactive forms
    ReactiveFormsModule, // from Angular, but required to use reactive forms
    FormRulesModule      // HERE is the import from ng-form-rules
  ],
  // other module stuff...
})
export class AppModule { }
```

Now that Angular _knows_ about `ng-form-rules` you can use its functionality in your app. For instance, you could create some simple model settings and a form to use in a component.

```typescript
import { Component, OnInit } from '@angular/core';
import { FormGroup, AbstractControl } from "@angular/forms";
import { ReactiveFormsRuleService, AdhocModelSettings, ModelSettingsBuilder } from 'ng-form-rules';

// model representing form data
interface Person {
  name: string;
}

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ]
})
export class AppComponent implements OnInit  {
  form: FormGroup;

  // receive an instance of ReactiveFormsRuleService via dependency injection
  constructor(private svc: ReactiveFormsRuleService) {
  }

  ngOnInit(): void {
    // create model settings
    const settings = AdhocModelSettings.create<Person>((builder: ModelSettingsBuilder) => {
      // return an array of properties
      return [
        builder.property('name', prop => { // add a name property to the settings
          prop.valid.push( // add validation to the name property
            builder.validNamedTest( // add a test to the validation with a name, message, and rule
              'name-required-test',
              `Name is required.`,
              builder.rule(person => !!person.name)
            )
          );
        }),
      ];
    });

    // create form group based on the model settings
    this.form = this.svc.createFormGroup(settings);
  }
}
```

`AppComponent` receives an instance of `ReactiveFormsRuleService` in its constructor. `ReactiveFormsRuleService` is the primary service used from `ng-form-rules` and it will be your best friend. Within the component's `ngOnInit()` you use this service to create model settings and then a `FormGroup` based upon those settings.

The settings are created using the static `create()` function on `AdhocModelSettings`. `create()` receives as a parameter a function that takes an instance of `ModelSettingsBuilder` and returns an array of properties. `ModelSettingsBuilder` is a helper class that is used to create properties and their associated validations, tests, rules, etc.

Now you can use the `FormGroup` in a template.

```html
<form [formGroup]="form">
	<div>
		<label for="name">Name: </label>
		<input type="text" id="name" formControlName="name" />
		<pre *ngIf="form.get('name').errors">{{ form.get('name').errors | json }}</pre>
	</div>
</form>
```

You did it! You successfully used `ng-form-rules` on your first form!

This was obviously a simple example and we know the real-world demands on forms are more complex. Please see our [docs](#docs) and [examples](#examples) to learn how you can use `ng-form-rules` to handle all your scenarios.

## <a id="docs"></a> [Documentation][link-wiki]

## <a id="examples"></a>Examples

We have links to pertinent examples throughout our [documentation][link-wiki], or you can just pick from a [list of our examples][link-examples]. We use StackBlitz for all our examples, which allows you to fully interact, fork, and edit them.

## <a id="license"></a> [License][link-mit-license]

<!-- LINK REFERENCES GO HERE -->
[link-wiki]: https://github.com/cknightdevelopment/ng-form-rules/wiki
[link-examples]: https://github.com/cknightdevelopment/ng-form-rules/wiki/examples
[link-stackblitz]: https://stackblitz.com/github/cknightdevelopment/ng-form-rules-examples
[link-examples-repo]: https://github.com/cknightdevelopment/ng-form-rules-examples
[link-getting-started]: https://stackblitz.com/edit/ngfr-getting-started?embed=1&file=src/app/app.component.ts
[link-mit-license]: https://github.com/cknightdevelopment/ng-form-rules/blob/master/LICENSE
[sb-getting-started]: https://stackblitz.com/edit/ngfr-getting-started?file=src%2Fapp%2Fapp.component.ts
