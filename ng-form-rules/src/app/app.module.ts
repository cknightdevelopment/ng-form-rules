import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { FormRulesModule } from './modules/form-rules/form-rules.module';
import { MODEL_SETTINGS_TOKEN } from './modules/form-rules/injection-tokens/model-settings.token';
import { BookModelSettings } from './sample-models/book';
import { TRACE_SETTINGS_TOKEN } from './modules/form-rules/injection-tokens/trace-settings.token';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormRulesModule,
    ReactiveFormsModule,
    CommonModule
  ],
  providers: [
      {
        provide: MODEL_SETTINGS_TOKEN,
        useValue: [
            new BookModelSettings("book")
        ]
    },
    { provide: TRACE_SETTINGS_TOKEN, useValue: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
