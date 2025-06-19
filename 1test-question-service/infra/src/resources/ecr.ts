import { Construct } from 'constructs';
import { EcrRepository } from '@cdktf/provider-aws/lib/ecr-repository';
import { DataAwsEcrLifecyclePolicyDocument } from '@cdktf/provider-aws/lib/data-aws-ecr-lifecycle-policy-document';
import { EcrLifecyclePolicy } from '@cdktf/provider-aws/lib/ecr-lifecycle-policy';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { EcrRepositoryPolicy } from '@cdktf/provider-aws/lib/ecr-repository-policy';
import { Token } from 'cdktf';

import { ecrConfig } from '../configs';

export class EcrResource {
  constructor(
    private readonly scope: Construct,
    readonly id: string,
  ) {
    const ecrRepository = new EcrRepository(
      this.scope,
      'onetest-question-service-repo',
      {
        name: ecrConfig.repoName,
        imageTagMutability: 'MUTABLE',
      },
    );

    // Create Lifecycle Policy Document
    const lifecyclePolicyDocument = new DataAwsEcrLifecyclePolicyDocument(
      this.scope,
      'onetest-question-service-repo-lifecycle-policy-document',
      {
        rule: [
          {
            priority: 1,
            description: 'Expire images older than 1 days',
            selection: [
              {
                tagStatus: 'untagged',
                countType: 'sinceImagePushed',
                countUnit: 'days',
                countNumber: 1,
              },
            ],
            action: [
              {
                type: 'expire',
              },
            ],
          },
        ],
      },
    );

    // Create ECR Lifecycle Policy
    new EcrLifecyclePolicy(
      this.scope,
      'onetest-question-service-repo-lifecycle',
      {
        repository: ecrRepository.name,
        policy: Token.asString(lifecyclePolicyDocument.json),
      },
    );

    // Create IAM Policy Document for ECR Repository Policy
    const policyDocument = new DataAwsIamPolicyDocument(
      this.scope,
      'onetest-question-service-repo-policy-doc',
      {
        statement: [
          {
            sid: 'OneTestQuestionServiceECRPolicy',
            actions: [
              'ecr:GetDownloadUrlForLayer',
              'ecr:BatchGetImage',
              'ecr:PutImage',
              'ecr:InitiateLayerUpload',
              'ecr:UploadLayerPart',
              'ecr:CompleteLayerUpload',
              'ecr:DescribeRepositories',
              'ecr:ListImages',
              'ecr:DeleteRepository',
              'ecr:BatchDeleteImage',
              'ecr:GetRepositoryPolicy',
              'ecr:SetRepositoryPolicy',
              'ecr:DeleteRepositoryPolicy',
            ],
            effect: 'Allow',
            principals: [
              {
                identifiers: ['992382669334'],
                type: 'AWS',
              },
            ],
          },
          {
            sid: 'TesSystemBackendECRPolicyForLambda',
            actions: ['ecr:BatchGetImage', 'ecr:GetDownloadUrlForLayer'],
            effect: 'Allow',
            principals: [
              {
                identifiers: ['lambda.amazonaws.com'],
                type: 'Service',
              },
            ],
          },
        ],
      },
    );

    // Create ECR Repository Policy
    new EcrRepositoryPolicy(
      this.scope,
      'onetest-question-service-repo-policy',
      {
        repository: ecrRepository.name,
        policy: Token.asString(policyDocument.json),
      },
    );
  }
}
