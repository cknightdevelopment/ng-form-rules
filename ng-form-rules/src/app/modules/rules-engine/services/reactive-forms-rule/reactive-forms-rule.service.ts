import { Injectable } from "@angular/core";
import { FormGroup, AbstractControl, ValidatorFn, FormBuilder, FormControl, FormArray, ValidationErrors } from '@angular/forms';
import { RulesEngineService } from "../rules-engine/rules-engine.service";

@Injectable()
export class ReactiveFormsRuleService {
    constructor(
        private rulesEngineSvc: RulesEngineService,
        private formBuilder: FormBuilder
    ) {
    }
}
