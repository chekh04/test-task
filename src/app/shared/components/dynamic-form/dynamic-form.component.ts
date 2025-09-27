import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { CustomValidators } from '../../validators';
import { CheckUsernameRequestData } from '../../interface/requests';
import { CheckUserResponseData } from '../../interface/responses';

@Component({
  selector: 'app-dynamic-form',
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.scss']
})
export class DynamicFormComponent implements OnInit, OnDestroy {
  private usernameCheckSubject = new Subject<{index: number, username: string}>();
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  public form: FormGroup = this.getForm();

  get formsArray(): FormArray {
    return this.form.get('forms') as FormArray;
  }

  get invalidFormsCount(): number {
    return this.formsArray.controls.filter(control => control.invalid).length;
  }

  ngOnInit() {
    this.addForm();

    this.usernameCheckSubject.pipe(
      debounceTime(500),
      distinctUntilChanged((prev, curr) => prev.index === curr.index && prev.username === curr.username),
      switchMap(({index, username}) => {
        if (!username) {
          return of({isAvailable: true, index});
        }

        const requestData: CheckUsernameRequestData = { username };
        return this.http.post<CheckUserResponseData>('/api/checkUsername', requestData).pipe(
          catchError(() => of({isAvailable: false})),
          switchMap(response => of({...response, index}))
        );
      })
    ).subscribe((response) => {
      const formIndex = response.index;
      if (formIndex >= 0 && formIndex < this.formsArray.length) {
        const usernameControl = this.formsArray.at(formIndex).get('username');
        if (response.isAvailable) {
          usernameControl?.setErrors(null);
        } else {
          usernameControl?.setErrors({ usernameNotAvailable: true });
        }
      }
    });
  }

  public addForm() {
    const formGroup = this.fb.group({
      country: ['', [Validators.required, CustomValidators.countryValidator()]],
      username: ['', [Validators.required]],
      birthday: ['', [Validators.required, CustomValidators.birthdayValidator()]]
    });

    const formIndex = this.formsArray.length;
    this.formsArray.push(formGroup);

    const usernameControl = formGroup.get('username');
    usernameControl?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(username => {
      this.usernameCheckSubject.next({index: formIndex, username: username || ''});
    });
  }

  public removeForm(index: number) {
    this.formsArray.removeAt(index);
  }

  public onSubmit() {
    if (this.form.valid) {
      const formData = this.form.value.forms;
      console.log('Submitting forms:', formData);

      this.http.post('/api/submitForm', { forms: formData }).subscribe({
        next: (response) => {
          console.log('Form submitted successfully:', response);
          alert('Forms submitted successfully!');
        },
        error: (error) => {
          console.error('Error submitting forms:', error);
          alert('Error submitting forms. Please try again.');
        }
      });
    }
  }

  private getForm(): FormGroup {
    return this.fb.group({
      forms: this.fb.array([])
    });
  }

  ngOnDestroy() {
    this.usernameCheckSubject.complete();
  }
}
