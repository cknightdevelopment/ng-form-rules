import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { FormRulesModule } from './modules/form-rules/form-rules.module';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormRulesModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
