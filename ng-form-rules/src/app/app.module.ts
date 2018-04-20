import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { FormRulesModule } from './modules/form-rules/form-rules.module';
import { MODEL_SETTINGS_TOKEN } from './modules/form-rules/injection-tokens/model-settings.token';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormRulesModule
  ],
  providers: [
      { provide: MODEL_SETTINGS_TOKEN, useValue: [1, 2, 3] }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
