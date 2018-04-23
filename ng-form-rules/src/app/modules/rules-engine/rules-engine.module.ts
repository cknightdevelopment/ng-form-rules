import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RulesEngineService } from './services/rules-engine/rules-engine.service';
import { ReactiveFormsRuleService } from './services/reactive-forms-rule/reactive-forms-rule.service';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
    imports: [
        CommonModule
    ],
    providers: [
        RulesEngineService,
        ReactiveFormsRuleService
    ],
    declarations: []
})
export class RulesEngineModule { }
