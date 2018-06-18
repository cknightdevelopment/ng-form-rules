import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { FormRulesModule, MODEL_SETTINGS_TOKEN, TRACE_SETTINGS_TOKEN } from 'ng-form-rules';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RegisterModelSettings } from './models/register';
import { JsonErrorsComponent } from './json-errors.component';
import { UserService } from './services/user.service';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    AppComponent,
    JsonErrorsComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    FormRulesModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [
    {
      provide: MODEL_SETTINGS_TOKEN,
      useValue: [
        new RegisterModelSettings('register')
      ]
    },
    { provide: TRACE_SETTINGS_TOKEN, useValue: true },
    UserService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
