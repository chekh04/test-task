import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { MockBackendInterceptor } from './shared/mock-backend/mock-backend.interceptor';
import { AppComponent } from './app.component';
import { InputValidationDirective } from './shared/directives/input-validation.directive';
import { TextInputComponent } from './shared/components/text-input/text-input.component';
import { DatepickerComponent } from './shared/components/datepicker/datepicker.component';
import { CountryInputComponent } from './shared/components/country-input/country-input.component';
import { DynamicFormComponent } from './shared/components/dynamic-form/dynamic-form.component';

@NgModule({
  declarations: [
    AppComponent,
    InputValidationDirective,
    TextInputComponent,
    DatepickerComponent,
    CountryInputComponent,
    DynamicFormComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    RouterOutlet,
    NgbModule
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: MockBackendInterceptor, multi: true }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
