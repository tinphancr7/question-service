import 'dotenv/config';

import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';

import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

import { awsConfig } from '../configs';
import { EcrResource } from '../resources';
const { region } = awsConfig;

export class EcrStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new S3Backend(this, {
      bucket: `tf-tes-state`,
      key: `infra/onetest-question-service/ecr/repo.tfstate`,
      region: region,
      dynamodbTable: `tes-infra-cdktf-lock`,
    });

    new ArchiveProvider(this, 'archive', {});
    new AwsProvider(this, 'aws', { region: region });

    // Create ECR Repository
    new EcrResource(this, 'ecr-resource');
  }
}
