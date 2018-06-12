import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent, BookModelSettings } from './app.component';
import { FormRulesModule, MODEL_SETTINGS_TOKEN, TRACE_SETTINGS_TOKEN } from 'ng-form-rules';
import { ReactiveFormsModule } from '@angular/forms';
import { RegisterModelSettings } from './models/register';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    FormRulesModule
  ],
  providers: [
    {
      provide: MODEL_SETTINGS_TOKEN,
      useValue: [
        new BookModelSettings('book'),
        new RegisterModelSettings('register')
      ]
  },
  { provide: TRACE_SETTINGS_TOKEN, useValue: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
