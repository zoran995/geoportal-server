import { DefaultFeedbackService } from '../default-feedback.service.js';

describe('GithubFeedbackService', () => {
  let service: DefaultFeedbackService;

  beforeEach(() => {
    service = new DefaultFeedbackService();
  });

  it('should throw error', async () => {
    expect.assertions(1);

    try {
      await service.post();
    } catch (err) {
      expect(err).toEqual(new Error('Feedback creation not supported.'));
    }
  });
});
