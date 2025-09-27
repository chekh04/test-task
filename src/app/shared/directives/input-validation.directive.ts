import { Directive, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import {merge, Subject, takeUntil} from 'rxjs';

@Directive({
  selector: '[appInputValidation]'
})
export class InputValidationDirective implements OnInit, OnDestroy {
  @Input() control!: AbstractControl;
  @Input() fieldName!: string;

  private errorElement?: HTMLDivElement;
  private destroy$ = new Subject<void>();

  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.control.statusChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateValidationState();
    });

    this.updateValidationState();
  }

  private updateValidationState() {
    const isInvalid = this.control.invalid && (this.control.dirty || this.control.touched);
    const isPending = this.control.pending;

    if (isInvalid && !isPending) {
      this.addErrorClass();
      this.showErrorMessage();
    } else {
      this.removeErrorClass();
      this.hideErrorMessage();
    }
  }

  private addErrorClass() {
    this.el.nativeElement.classList.add('is-invalid');
    this.el.nativeElement.style.borderColor = '#dc3545';
    this.el.nativeElement.style.borderWidth = '2px';
  }

  private removeErrorClass() {
    this.el.nativeElement.classList.remove('is-invalid');
    this.el.nativeElement.style.borderColor = '';
    this.el.nativeElement.style.borderWidth = '';
  }

  private showErrorMessage() {
    if (!this.errorElement) {
      this.createErrorElement();
    }
    this.errorElement!.style.display = 'block';
  }

  private hideErrorMessage() {
    if (this.errorElement) {
      this.errorElement.style.display = 'none';
    }
  }

  private createErrorElement() {
    this.errorElement = document.createElement('div');
    this.errorElement.className = 'invalid-feedback';
    this.errorElement.textContent = `Please provide a correct ${this.fieldName}`;

    this.el.nativeElement.parentNode.insertBefore(
      this.errorElement,
      this.el.nativeElement.nextSibling
    );
  }

  private removeErrorElement() {
    if (this.errorElement && this.errorElement.parentNode) {
      this.errorElement.parentNode.removeChild(this.errorElement);
      this.errorElement = undefined;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.removeErrorElement();
  }
}
