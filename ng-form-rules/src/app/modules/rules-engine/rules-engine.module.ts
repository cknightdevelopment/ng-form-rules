import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RulesEngineService } from './services/rules-engine/rules-engine.service';

@NgModule({
    imports: [
        CommonModule
    ],
    providers: [
        RulesEngineService
    ],
    declarations: []
})
export class RulesEngineModule { }
