import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import {Form, FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import {debounceTime, distinctUntilChanged, switchMap, catchError, first} from 'rxjs/operators';
import { of, Subject, timer, takeUntil } from 'rxjs';
import { CheckUsernameRequestData } from '../../interface/requests';
import { CheckUserResponseData } from '../../interface/responses';
import {CustomValidators} from "../../validators/custom-validators";

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
    this.validateUserNameOnChange();
  }

  public addForm() {
    const formGroup = this.fb.group({
      country: ['', [Validators.required, CustomValidators.countryValidator()]],
      username: ['', [Validators.required]],
      birthday: ['', [Validators.required]]
    });

    const formIndex = this.formsArray.length;
    this.formsArray.push(formGroup);
    this.subscribeOnUserNameChanges(formGroup, formIndex);
  }

  public removeForm(index: number) {
    this.formsArray.removeAt(index);
  }

  public onSubmit() {
    if (this.form.valid && !this.isSubmitting) {
      this.startSubmissionProcess();
    }
  }

  public cancelSubmission() {
    this.stopSubmissionProcess();
  }

  private validateUserNameOnChange(): void {
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

  private subscribeOnUserNameChanges(formGroup: FormGroup, formIndex: number): void {
    const usernameControl = formGroup.get('username');
    usernameControl?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(username => {
      this.usernameCheckSubject.next({index: formIndex, username: username || ''});
    });
  }

  private startSubmissionProcess() {
    this.isSubmitting = true;
    this.timerActive = true;
    this.timeRemaining = this.MAX_TIMER_TIME;
    this.form.disable();

    const countdown = timer(0, 1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tick) => {
          this.timeRemaining = this.MAX_TIMER_TIME - tick;
          if (this.timeRemaining <= 0) {
            countdown.unsubscribe();
            this.submitForms();
          }
        }
      });
  }

  private stopSubmissionProcess() {
    this.isSubmitting = false;
    this.timerActive = false;
    this.timeRemaining = 0;

    this.form.enable();
    this.destroy$.next();
  }

  private submitForms() {
    if (!this.isSubmitting) {
      return;
    }

    this.timerActive = false;
    const formData = this.form.value.forms;

    this.http.post('/api/submitForm', { forms: formData }).pipe(first()).subscribe({
      next: (response) => {
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
    this.formsArray.controls.forEach(formGroup => {
      formGroup.reset();
    });
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
