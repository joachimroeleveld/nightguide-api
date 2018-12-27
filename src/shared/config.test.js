const config = require('./config');

describe('config', () => {
  describe('getBoolean', () => {
    it('happy path', () => {
      process.env.dummyTest = 'true';
      const result = config.getBoolean('dummyTest');
      expect(result).toEqual(true);
    });

    it('ignores case', () => {
      process.env.dummyTest = 'tRUe';
      const result = config.getBoolean('dummyTest');
      expect(result).toEqual(true);
    });

    it('returns false for undefined', () => {
      const result = config.getBoolean('dummyTest2');
      expect(result).toEqual(false);
    });

    it('returns false for not true', () => {
      process.env.dummyTest = 'wrong';
      const result = config.getBoolean('dummyTest');
      expect(result).toEqual(false);
    });
  });

  describe('getIsProduction', () => {
    it('returns true for production env', () => {
      process.env.NODE_ENV = 'production';
      const result = config.getIsProduction();
      expect(result).toEqual(true);
    });

    it('returns true for production env uppercase', () => {
      process.env.NODE_ENV = 'PRODUCTION';
      const result = config.getIsProduction();
      expect(result).toEqual(true);
    });

    it('returns false for staging env', () => {
      process.env.NODE_ENV = 'staging';
      const result = config.getIsProduction();
      expect(result).toEqual(false);
    });
  });

  describe('get', () => {
    it('returns raw env value', () => {
      process.env.someValue = 'test';
      const result = config.get('someValue');
      expect(result).toEqual('test');
    });
  });
});
