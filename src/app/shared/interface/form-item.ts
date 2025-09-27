import {FormGroup} from "@angular/forms";
import {Subscription} from "rxjs";

export interface FormItem {
  readonly id: number;
  formGroup: FormGroup;
  usernameSubscription?: Subscription;
}
