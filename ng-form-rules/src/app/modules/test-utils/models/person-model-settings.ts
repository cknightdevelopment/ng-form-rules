import { AbstractModelSettings } from "../../form-rules/models/abstract-model-settings";
import { Person } from "./person";
import { Property } from "../../form-rules/models/property";

export let validPerson: Person = { name: "Chris", age: 100, nicknames: ["C-Dog", "C"] };
export let invalidPerson: Person = { name: "Tom", age: 999, nicknames: ["T-Dog", "T", "T-Town"] };

export class PersonModelSettings extends AbstractModelSettings<Person> {
    buildPropertyRules(): Property<Person>[] {
        return [
            this.builder.property("name", p => {
                p.valid = [
                    {
                        name: "Chris",
                        message: "Doesn't equal Chris",
                        check: {
                            rules: [
                                { func: (x) => x.name == "Chris" }
                            ]
                        }
                    }
                ];
                p.edit = [
                    {
                        name: "First Character",
                        message: "The first letter isn't C.",
                        check: {
                            rules: [
                                { func: (x) => x.name.startsWith("C") }
                            ]
                        }
                    }
                ];
                p.view = [
                    {
                        name: "Length",
                        message: "Not 5 characters long.",
                        check: {
                            rules: [
                                { func: (x) => x.name.length === 5 }
                            ]
                        }
                    }
                ];
            }),
            this.builder.property("age", p => {
                p.valid = [
                    {
                        name: "100",
                        message: "Not 100",
                        check: {
                            rules: [
                                { func: (x) => x.age == 100 }
                            ]
                        }
                    }
                ];
            }),
            this.builder.property("nicknames", p => {
                p.valid = [
                    { message: "Must have 2 nicknames", check: { func: x => (x.nicknames || []).length == 2} }
                ];

                p.arrayItemProperty = this.builder.arrayItemProperty<string>(aip => {
                    aip.valid = [
                        {
                            check: {
                                func: (x) => x.startsWith("C")
                            }
                        }
                    ];
                });
            })
        ];
    }
}
