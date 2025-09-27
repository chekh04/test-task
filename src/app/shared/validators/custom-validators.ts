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
}
