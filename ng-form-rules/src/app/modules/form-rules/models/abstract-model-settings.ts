import { ModelSettingsBuilder } from "../helper/model-settings-builder";
import { Property } from "./property";

export abstract class AbstractModelSettings<T> {
    private _name: string;
    get name(): string {
        return this._name;
    }

    protected builder: ModelSettingsBuilder;
    readonly properties: Property<T>[];

    constructor(name: string) {
        this.builder = new ModelSettingsBuilder();
        this._name = name;
        this.properties = this.buildPropertyRules() || [];
    }

    protected abstract buildPropertyRules(): Property<T>[];
}