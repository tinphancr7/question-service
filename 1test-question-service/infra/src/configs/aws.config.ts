export const awsConfig = {
  env: process.env.INFRA_ENV || 'dev',
  region: process.env.AWS_REGION || 'ap-northeast-2',
  accountId: process.env.AWS_ACCOUNT_ID || '992382669334',
};
