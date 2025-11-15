// Simple smoke test to verify testing infrastructure works

describe('Testing Infrastructure', () => {
  it('should run basic Jest tests', () => {
    expect(true).toBe(true);
  });

  it('should support async/await', async () => {
    const promise = Promise.resolve(42);
    const result = await promise;
    expect(result).toBe(42);
  });

  it('should mock functions', () => {
    const mockFn = jest.fn();
    mockFn.mockReturnValue('mocked');

    expect(mockFn()).toBe('mocked');
    expect(mockFn).toHaveBeenCalled();
  });
});
