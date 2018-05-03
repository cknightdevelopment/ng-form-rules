import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RulesEngineService } from './services/rules-engine/rules-engine.service';
import { ReactiveFormsRuleService } from './services/reactive-forms-rule/reactive-forms-rule.service';
import { ReactiveFormsModule } from '@angular/forms';
import { UtilsModule } from '../utils/utils.module';

@NgModule({
    imports: [
        CommonModule,
        UtilsModule
    ],
    providers: [
        RulesEngineService,
        ReactiveFormsRuleService
    ],
    declarations: []
})
export class RulesEngineModule { }
