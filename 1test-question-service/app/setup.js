global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
};

process.env = {
  INFRA_ENV: 'dev',
  AWS_REGION: 'region',
  FILE_S3_BUCKET_NAME: 'bucket',
  FILE_CF_DISTRIBUTION_ID: 'cdn',
};
