import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RulesEngineModule } from '../rules-engine/rules-engine.module';

/**
 * Main module for ng-form-rules
 */
@NgModule({
  imports: [
    CommonModule,
    RulesEngineModule,
  ],
  declarations: [],
  exports: [
      RulesEngineModule,
  ]
})
export class FormRulesModule { }
