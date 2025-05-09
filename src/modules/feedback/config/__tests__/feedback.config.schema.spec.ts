import { feedbackConfig } from '../schema/feedback.config.schema.js';

describe('Feedback config', () => {
  it('should pass with empty object', () => {
    const result = feedbackConfig.parse({});

    expect(result).toEqual({ primaryId: '__default__', options: undefined });
  });

  it('should fail when primaryId is not in options', () => {
    const result = feedbackConfig.safeParse({
      primaryId: 'not-existing',
      options: [
        {
          id: 'test',
          service: 'github',
          issuesUrl: 'https://example.com',
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it('should fail when primaryId specified without options', () => {
    const result = feedbackConfig.safeParse({
      primaryId: 'test',
    });

    expect(result.success).toBe(false);
  });
});
