import { AbstractModelSettings } from "./abstract-model-settings";

class PersonModelSettings extends AbstractModelSettings<Person> {
    init(): void {
        this.properties = [
            this.builder.property("name", p => {

            }),
            this.builder.property("age", p => {

            }),
        ];
    }
}

class Person {
    name: string;
    age: number;
}