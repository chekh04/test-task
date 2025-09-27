import { Component, Input, forwardRef, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, AbstractControl } from '@angular/forms';
import { Country } from '../../enum/country';

@Component({
  selector: 'app-country-input',
  template: `
    <div class="form-group">
      <label [for]="inputId" class="form-label">{{ label }}</label>
      <div class="position-relative">
        <input
          [id]="inputId"
          type="text"
          class="form-control"
          [placeholder]="placeholder"
          [value]="value"
          (input)="onInput($event)"
          (focus)="onFocus()"
          (blur)="onBlur()"
          [disabled]="disabled"
          autocomplete="off"
          appInputValidation
          [control]="control"
          [fieldName]="fieldName"
        />
        <div 
          *ngIf="showSuggestions && filteredCountries.length > 0" 
          class="dropdown-menu show position-absolute w-100"
          style="top: 100%; z-index: 1000;"
        >
          <button
            *ngFor="let country of filteredCountries; trackBy: trackByCountry"
            type="button"
            class="dropdown-item"
            (click)="selectCountry(country)"
          >
            {{ country }}
          </button>
        </div>
      </div>
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CountryInputComponent),
      multi: true
    }
  ]
})
export class CountryInputComponent implements ControlValueAccessor, OnInit {
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() inputId: string = '';
  @Input() control!: AbstractControl;
  @Input() fieldName: string = '';

  value: string = '';
  disabled: boolean = false;
  showSuggestions: boolean = false;
  filteredCountries: string[] = [];
  
  private allCountries = Object.values(Country);
  private onChange = (value: string) => {};
  private onTouched = () => {};

  ngOnInit() {
    this.filteredCountries = this.allCountries;
  }

  onInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
    this.filterCountries(this.value);
    this.showSuggestions = true;
  }

  onFocus() {
    this.showSuggestions = true;
    this.filterCountries(this.value);
  }

  onBlur() {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      this.showSuggestions = false;
      this.onTouched();
    }, 150);
  }

  selectCountry(country: string) {
    this.value = country;
    this.onChange(this.value);
    this.showSuggestions = false;
  }

  private filterCountries(input: string) {
    if (!input) {
      this.filteredCountries = this.allCountries;
    } else {
      this.filteredCountries = this.allCountries.filter(country =>
        country.toLowerCase().includes(input.toLowerCase())
      );
    }
  }

  trackByCountry(index: number, country: string): string {
    return country;
  }

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
