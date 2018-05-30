import { AbstractModelSettings } from "../modules/form-rules/models/abstract-model-settings";
import { Property } from "../modules/form-rules/models/property";
import { Observable, timer } from "rxjs";
import { map } from "rxjs/operators";

export class Book {
    title: string;
    pageCount: number;
    realtime: number;
}

export class BookModelSettings extends AbstractModelSettings<Book> {
    protected buildPropertyRules(): Property<Book>[] {
        return [
            this.builder.property<Book>("title", p => {
                p.valid = [
                    {
                        message: "Cannot be empty",
                        check: {
                            func: x => !!x.title
                        },
                    }
                ];
            }),
            this.builder.property<Book>("pageCount", p => {
                p.valid = [
                    {
                        message: "Must be greater than 0",
                        check: { func: x => x.pageCount > 0 },
                        condition: { func: x => !!x.pageCount || x.pageCount === 0 }
                    },
                ];
            }),
            this.builder.property<Book>("realtime", p => {
                p.valid = [
                    {
                        message: "Realtime is invalid",
                        check: {
                            asyncFunc: x => timer(1000)
                                .pipe(
                                    map(y => x.realtime == 99)
                                )
                        }
                    }
                ];
            })
        ];
    }
}