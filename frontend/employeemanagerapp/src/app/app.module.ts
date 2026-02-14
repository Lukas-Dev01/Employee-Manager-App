// App components
import { NgModule } from '@angular/core';

import { App } from './app';
import { EmployeeService } from './employee.service';
import { BrowserModule } from '@angular/platform-browser';

@NgModule({
  imports: [
    BrowserModule,
    App
  ],
  providers: [EmployeeService],
  bootstrap: [App]
})
export class AppModule { }