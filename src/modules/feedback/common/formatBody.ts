import { Request } from 'express';

import { AdditionalParametersDto } from '../dto/additional-parameters.dto';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';

export function formatBody(
  feedback: CreateFeedbackDto,
  req: Request,
  additionalParameters: AdditionalParametersDto[] = [],
): string {
  let result = '';
  result += feedback.comment;
  result += '\n\n### Detalji o korisniku\n';
  result += `* Ime: ${feedback.name} \n`;
  result += `* Email: ${feedback.email}\n`;
  result += `* IP Address: ${req.ip}\n`;
  result += `* User Agent: ${req.header('User-Agent')}\n`;
  result += `* Referrer: ${req.header('Referrer')} \n`;
  result += `* Share URL: ${feedback.shareLink}\n`;
  if (additionalParameters) {
    additionalParameters.forEach((parameter) => {
      result += `* ${parameter.descriptiveLabel}: ${
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (<any>feedback)[parameter.name] || 'Nije unešeno'
      }\n`;
    });
  }
  return result;
}
