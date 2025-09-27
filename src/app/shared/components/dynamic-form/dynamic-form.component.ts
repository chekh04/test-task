import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, switchMap, catchError, first, takeUntil } from 'rxjs/operators';
import { of, Subject, timer, Subscription } from 'rxjs';
import { CheckUsernameRequestData } from '../../interface/requests';
import { CheckUserResponseData } from '../../interface/responses';
import { CustomValidators } from "../../validators/custom-validators";
import {FormItem} from "../../interface/form-item";
import {FORM_CONFIG} from "../../utils/FORM_CONFIG";

@Component({
  selector: 'app-dynamic-form',
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.scss']
})
export class DynamicFormComponent implements OnInit, OnDestroy {
  private readonly usernameCheckSubject = new Subject<{ control: AbstractControl, username: string }>();
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly destroy$ = new Subject<void>();
  private nextFormId = 0;
  private countdownSubscription?: Subscription;

  public readonly form: FormGroup = this.getForm();
  public isSubmitting = false;
  public timeRemaining = 0;
  public timerActive = false;
  public formsData: FormItem[] = [];

  get formsArray(): FormArray {
    return this.form.get('forms') as FormArray;
  }

  get invalidFormsCount(): number {
    return this.formsData.filter(formData => formData.formGroup.invalid).length;
  }

  get canAddMoreForms(): boolean {
    return this.formsData.length < FORM_CONFIG.MAX_FORMS;
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

    const formData: FormItem = {
      id: this.nextFormId++,
      formGroup: formGroup,
      usernameSubscription: this.subscribeOnUserNameChanges(formGroup)
    };

    this.formsData.push(formData);
    this.formsArray.push(formGroup);
  }

  public removeForm(formId: number): void {
    const index = this.formsData.findIndex(form => form.id === formId);
    if (index !== -1) {
      const formItem = this.formsData[index];
      formItem.usernameSubscription?.unsubscribe();

      this.formsData.splice(index, 1);
      this.formsArray.removeAt(index);
    }
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
      debounceTime(FORM_CONFIG.USERNAME_CHECK_DEBOUNCE_MS),
      distinctUntilChanged((prev, curr) => prev.username === curr.username),
      switchMap(({ control, username }) => {
        if (!username) {
          return of({ isAvailable: true, control });
        }

        const requestData: CheckUsernameRequestData = { username };
        return this.http.post<CheckUserResponseData>('/api/checkUsername', requestData).pipe(
          catchError(() => of({ isAvailable: false })),
          switchMap(response => of({ ...response, control }))
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe((response) => {
      const usernameControl = response.control;
      if (response.isAvailable) {
        usernameControl.setErrors(null);
      } else {
        usernameControl.setErrors({ usernameNotAvailable: true });
      }
    });
  }

  private subscribeOnUserNameChanges(formGroup: FormGroup): Subscription {
    const usernameControl = formGroup.get('username');
    return usernameControl?.valueChanges.pipe(
      debounceTime(FORM_CONFIG.USERNAME_CHECK_DEBOUNCE_MS),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(username => {
      this.usernameCheckSubject.next({ control: usernameControl!, username: username || '' });
    }) || new Subscription();
  }

  private startSubmissionProcess(): void {
    this.isSubmitting = true;
    this.timerActive = true;
    this.timeRemaining = FORM_CONFIG.SUBMISSION_TIMER_SECONDS;
    this.form.disable();

    this.countdownSubscription = timer(0, 1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tick) => {
          this.timeRemaining = FORM_CONFIG.SUBMISSION_TIMER_SECONDS - tick;
          if (this.timeRemaining <= 0) {
            this.submitForms();
          }
        }
      });
  }

  private stopSubmissionProcess(): void {
    this.isSubmitting = false;
    this.timerActive = false;
    this.timeRemaining = 0;

    this.countdownSubscription?.unsubscribe();
    this.form.enable();
  }

  private submitForms(): void {
    if (!this.isSubmitting) {
      return;
    }

    this.timerActive = false;
    const formData = this.form.value.forms;

    this.http.post('/api/submitForm', { forms: formData })
      .pipe(
        first(),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => {
          this.clearForms();
          this.stopSubmissionProcess();
          this.showSuccessMessage();
        },
        error: (error) => {
          console.error('Error submitting forms:', error);
          this.stopSubmissionProcess();
          this.showErrorMessage(error);
        }
      });
  }

  private clearForms(): void {
    this.formsData.forEach(formData => {
      formData.formGroup.reset();
    });
  }

  private showSuccessMessage(): void {
    alert('Forms submitted successfully!');
  }

  private showErrorMessage(error: any): void {
    const errorMessage = error?.message || 'Unknown error occurred';
    alert(`Error submitting forms: ${errorMessage}. Please try again.`);
  }

  private getForm(): FormGroup {
    return this.fb.group({
      forms: this.fb.array([])
    });
  }

  ngOnDestroy(): void {
    this.formsData.forEach(formData => {
      formData.usernameSubscription?.unsubscribe();
    });

    this.countdownSubscription?.unsubscribe();

    this.destroy$.next();
    this.destroy$.complete();
    this.usernameCheckSubject.complete();
  }
}
