import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { of, Subject, timer, takeUntil } from 'rxjs';
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
  private destroy$ = new Subject<void>();
  private MAX_TIMER_TIME = 5;

  public form: FormGroup = this.getForm();
  public isSubmitting = false;
  public timeRemaining = 0;
  public timerActive = false;

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
    console.log(this.form);
    if (this.form.valid && !this.isSubmitting) {
      this.startSubmissionProcess();
    }
  }

  public cancelSubmission() {
    this.stopSubmissionProcess();
  }

  private startSubmissionProcess() {
    console.log(this.form);
    this.isSubmitting = true;
    this.timerActive = true;

    // Disable all form controls
    this.form.disable();

    timer(0, 1000)
      .pipe(
        takeUntil(this.destroy$),
        takeUntil(timer(5000))
      )
      .subscribe({
        next: (tick) => {
          this.timeRemaining = this.MAX_TIMER_TIME - tick;
          if (this.timeRemaining <= 0) {
            this.submitForms();
          }
        }
      });
  }

  private stopSubmissionProcess() {
    this.isSubmitting = false;
    this.timerActive = false;
    this.timeRemaining = 0;

    // Re-enable all form controls
    this.form.enable();
  }

  private submitForms() {
    this.timerActive = false;
    const formData = this.form.value.forms;
    console.log('Submitting forms:', formData);

    this.http.post('/api/submitForm', { forms: formData }).subscribe({
      next: (response) => {
        console.log('Form submitted successfully:', response);
        this.clearForms();
        this.stopSubmissionProcess();
        alert('Forms submitted successfully!');
      },
      error: (error) => {
        console.error('Error submitting forms:', error);
        this.stopSubmissionProcess();
        alert('Error submitting forms. Please try again.');
      }
    });
  }

  private clearForms() {
    // Clear all forms and reset to initial state
    this.formsArray.clear();
    this.addForm();
  }

  private getForm(): FormGroup {
    return this.fb.group({
      forms: this.fb.array([])
    });
  }

  ngOnDestroy() {
    this.usernameCheckSubject.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
