import { AbstractModelSettings } from "./abstract-model-settings";

class PersonModelSettings extends AbstractModelSettings<Person> {
    init(): void {
        this.properties = [
            this.builder.property("name", p => {
                p.valid = [
                    this.builder.validationWithMessage<Person>("Boo!", {
                        any: true,
                        rules: [
                            {
                                func: (x) => x.name == "Chris"
                            }
                        ]
                    })
                ];

                p.properties = [
                    this.builder.property<Car>("make", cp => {})
                ];

                p.arrayItemProperty = this.builder.arrayItemProperty<Car>(aip => {
                    aip.valid = [
                        this.builder.validation<Car>({ func: (car) => car.year > 2000 })
                    ];
                });
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

class Car {
    make: string;
    year: number;
}