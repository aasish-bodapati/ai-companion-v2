/**
 * Basic test to verify Jest setup is working
 */
describe('Jest Setup', () => {
  it('should be able to run tests', () => {
    expect(true).toBe(true);
  });

  it('should have proper math operations', () => {
    expect(2 + 2).toBe(4);
    expect(5 * 3).toBe(15);
  });
});
