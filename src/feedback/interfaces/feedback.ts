export interface Feedback {
  readonly name: string;
  readonly email: string;
  readonly shareLink: string;
  readonly comment: string;

  [additionalParameters: string]: string;
}
