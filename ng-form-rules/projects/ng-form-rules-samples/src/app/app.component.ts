import { Component, OnInit } from '@angular/core';
import { ReactiveFormsRuleService, AbstractModelSettings, Property, RulesEngineService } from 'ng-form-rules';
import { FormGroup, FormArray } from '@angular/forms';

@Component({
  selector: 'samples-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  registerForm: FormGroup;
  registerForm2: FormGroup;

  constructor(private svc: ReactiveFormsRuleService, private engine: RulesEngineService) {
  }

  ngOnInit(): void {
    // this.sampleFormGroup = this.svc.createFormGroup('book', {
    //   title: 'Great Gatsby',
    //   similarBooks: [ {title: "Another Book 1"}, {title: "Another Book 2"}, {title: "Another Book 3"} ],
    //   favoriteBookSets: [[{title: "1"}, {title: "2"}, {title: "3"}], [{title: "7"}, {title: "8"}, {title: "9"}]]
    // });

    this.registerForm = this.svc.createFormGroup('register');
  }
}

export class BookModelSettings extends AbstractModelSettings<Book> {
  private harryPotterStuff(book: Book): boolean {
    return book.favoriteBookSets && book.favoriteBookSets[1]
      && book.favoriteBookSets[1][1] && book.favoriteBookSets[1][1].title == "Harry Potter";
  }

  protected buildPropertyRules(): Property<Book>[] {
    return [
      this.builder.property('title', (p) => {
        p.valid = [
          { name: "has-title", message: `Title is required`, check: { func: (book) => !!book.title } },
          { name: "set-two-book-two", message: `Set 2 Book 2 must be "Harry Potter"`, check: { func: this.harryPotterStuff,
            options: { dependencyProperties: ['favoriteBookSets.1.1.title'] } } }
        ];
        p.edit = [
          { name: "has-title", check: {
            func: (book: Book) => (book.pageCount || 0) < 100, options: {dependencyProperties: ['pageCount'] } } }
        ];
      }),
      this.builder.property('pageCount', p => {
        p.valid = [
          { name: "positive-page-count", message: "Page count cannot be negative", check: { func: (book) => (book.pageCount || 0) >= 0 } }
        ];
      }),
      this.builder.property('author', p => {
        p.properties = [
          this.builder.property<Author>('name', pp => {
            pp.valid = [
              { name: "length", message: `Length is bad`, check: { func: (author) => author.name.length < 10 },
                condition: { func: (author) => !!author.name } },
            ];
          })
        ];
      }),
      this.builder.property('similarBooks', p => {
        p.arrayItemProperty = this.builder.arrayItemProperty<Book>(aip => {
          aip.properties = [
            this.builder.property('title')
          ];
        });
      }),
      this.builder.property('favoriteBookSets', p => {
        p.valid = [
          { name: 'favoriteBookSets-count', message: 'Must have 3 favorite book sets',
            check: { func: (book) => (book.favoriteBookSets || []).length === 3 } }
        ];

        p.arrayItemProperty = this.builder.arrayItemProperty<Book[]>(aip => {
          aip.arrayItemProperty = this.builder.arrayItemProperty<Book>(aip2 => {
            aip2.properties = [
              this.builder.property('title')
            ];
          });
        });
      }),
    ];
  }
}

export class Book {
  title: string;
  pageCount: number;
  author: Author;
  similarBooks: Book[];
  favoriteBookSets: Book[][];
}

export class Author {
  name: string;
}