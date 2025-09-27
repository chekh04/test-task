import { Directive, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appInputValidation]'
})
export class InputValidationDirective implements OnInit, OnDestroy {
  @Input() control!: AbstractControl;
  @Input() fieldName!: string;
  
  private subscription?: Subscription;
  private errorElement?: HTMLDivElement;

  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.subscription = this.control.statusChanges.subscribe(() => {
      this.updateValidationState();
    });
    
    // Initial validation state
    this.updateValidationState();
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    this.removeErrorElement();
  }

  private updateValidationState() {
    const isInvalid = this.control.invalid && (this.control.dirty || this.control.touched);
    
    if (isInvalid) {
      this.addErrorClass();
      this.showErrorMessage();
    } else {
      this.removeErrorClass();
      this.hideErrorMessage();
    }
  }

  private addErrorClass() {
    this.el.nativeElement.classList.add('is-invalid');
  }

  private removeErrorClass() {
    this.el.nativeElement.classList.remove('is-invalid');
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
    
    // Insert after the input element
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
}
