import { Injectable, Inject } from '@angular/core';
import { MODEL_SETTINGS_TOKEN } from '../../../form-rules/injection-tokens/model-settings.token';
import { AbstractModelSettings } from '../../../form-rules/models/abstract-model-settings';

class CompiledModelSettings<T> {
    constructor(public name: string) {
    }
}

/**
 * Engine that digests model settings and applies their rules appropriately
 */
@Injectable()
export class RulesEngineService {

    private compiledModelSettings: {
        [key: string]: CompiledModelSettings<any>;
    };

    constructor(
        @Inject(MODEL_SETTINGS_TOKEN) private modelSettings: AbstractModelSettings<any>[]
    ) {
        this.init();
    }

    log() {
        console.log(this.modelSettings);
    }

    /**
     * Gets a compiled model setting
     * @param name Name of compiled model setting
     */
    getModelSettings<T>(name: string): CompiledModelSettings<T> {
        return this.compiledModelSettings[name];
    }

    private init() {
        this.compiledModelSettings = {};

        this.modelSettings.forEach(x => {
            this.compiledModelSettings[x.name] = this.compileRules(x);
        });
    }

    private compileRules<T>(modelSetting: AbstractModelSettings<T>): CompiledModelSettings<T> {
        const compiledSetting = new CompiledModelSettings(modelSetting.name);
        return compiledSetting;
    }
}
