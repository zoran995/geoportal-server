import { Request } from 'express';

import { AdditionalParametersType } from '../dto/additional-parameters.dto';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';

export function formatBody(
  feedback: CreateFeedbackDto,
  req: Request,
  additionalParameters: AdditionalParametersType[] = [],
): string {
  let result = '';
  result += feedback.comment;
  result += '\n\n### User details\n';
  result += `* Name: ${feedback.name} \n`;
  result += `* Email: ${feedback.email}\n`;
  result += `* IP Address: ${req.ip}\n`;
  result += `* User Agent: ${req.header('User-Agent')}\n`;
  result += `* Referrer: ${req.header('Referrer')} \n`;
  result += `* Share URL: ${feedback.shareLink}\n`;
  if (additionalParameters) {
    additionalParameters.forEach((parameter) => {
      result += `* ${parameter.descriptiveLabel}: ${
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (<any>feedback)[parameter.name] || 'Not provided'
      }\n`;
    });
  }
  return result;
}
