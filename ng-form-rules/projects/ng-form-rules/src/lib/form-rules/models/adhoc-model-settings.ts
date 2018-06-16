import { AbstractModelSettings } from "./abstract-model-settings";
import { ModelSettingsBuilder } from "../helper/model-settings-builder";
import { Property } from "./property";

export class AdhocModelSettings<T> extends AbstractModelSettings<T> {
    static create<T>(b: (builder: ModelSettingsBuilder) => Property<T>[]): AdhocModelSettings<T> {
        const instance = new AdhocModelSettings();
        instance.properties = !!b ? b(instance.builder) || [] : [];

        return instance;
    }

    private constructor() {
        super('adhoc');
    }

    protected buildProperties(): Property<T>[] {
        return [];
    }
}