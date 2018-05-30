import { Component, OnInit } from '@angular/core';
import { RulesEngineService } from './modules/rules-engine/services/rules-engine/rules-engine.service';
import { ReactiveFormsRuleService } from './modules/rules-engine/services/reactive-forms-rule/reactive-forms-rule.service';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'ngfr-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  title = 'app';
  bookFormGroup: FormGroup;
  submitted = false;

  constructor(
    private rulesEngineSvc: RulesEngineService,
    private reactiveFormsRuleSvc: ReactiveFormsRuleService
  ) {
  }

  ngOnInit(): void {
     this.bookFormGroup = this.reactiveFormsRuleSvc.createFormGroup('book');
  }

  submit() {
    this.submitted = true;
  }
}
