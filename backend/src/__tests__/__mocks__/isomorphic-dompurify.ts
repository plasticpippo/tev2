const dompurifyMock = {
  sanitize: jest.fn((input: string) => {
    if (typeof input !== 'string') return '';
    return input.replace(/<[^>]*>/g, '');
  }),
  setConfig: jest.fn(),
  addHook: jest.fn(),
  removeHook: jest.fn(),
  removeAllHooks: jest.fn(),
  isValidAttribute: jest.fn(() => true),
};

export default dompurifyMock;
