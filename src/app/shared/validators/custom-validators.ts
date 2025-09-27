import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Country } from '../enum/country';

export class CustomValidators {
  static countryValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const countryValues = Object.values(Country);
      const isValidCountry = countryValues.includes(control.value as Country);

      return isValidCountry ? null : { invalidCountry: true };
    };
  }

  static birthdayValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const selectedDate = new Date(control.value);
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      return selectedDate <= today ? null : { futureDate: true };
    };
  }
}
