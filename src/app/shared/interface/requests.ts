export interface CheckUsernameRequestData {
  username: string;
}

export interface FormData {
  country: string;
  username: string;
  birthday: string;
}

export interface SubmitFormRequestData {
  forms: FormData[];
}
