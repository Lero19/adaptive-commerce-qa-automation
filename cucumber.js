const common = {
  requireModule: ['ts-node/register'],
  require: [
    'features/support/**/*.ts',
    'features/**/*.steps.ts'
  ],
  paths: ['features/**/*.feature'],
  format: [
    'progress',
    'json:reports/cucumber-report.json'
  ],
  publishQuiet: true,
  parallel: 1
};

module.exports = {
  default: {
    ...common,
    formatOptions: {
      snippetInterface: 'async-await'
    }
  }
};
