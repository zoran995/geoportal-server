import { NotImplementedException } from '@nestjs/common';
import { DefaultFeedbackService } from '../default-feedback.service.js';

describe('GithubFeedbackService', () => {
  let service: DefaultFeedbackService;

  beforeEach(() => {
    service = new DefaultFeedbackService();
  });

  it('should throw error', async () => {
    expect.assertions(2);

    try {
      await service.post();
    } catch (err) {
      expect(err).toBeInstanceOf(NotImplementedException);
      expect((err as NotImplementedException).message).toBe(
        'Feedback creation not supported.',
      );
    }
  });
});
