# AWS IAM Roles Anywhere Integration

This service integrates with AWS IAM Roles Anywhere to obtain temporary credentials using X.509 certificates, perfect for on-premises or multi-cloud deployments.

## 📋 Prerequisites

1. **AWS IAM Roles Anywhere Setup** (done in AWS Console):

   - Trust Anchor configured
   - Profile created
   - IAM Role with appropriate permissions
   - X.509 certificates (client certificate and private key)

2. **AWS Credential Helper Tool**

## 🛠️ Setup Instructions

### 1. Download AWS Credential Helper

Download the credential helper for Windows:

```powershell
# Download to tools directory
curl -o tools/aws_signing_helper.exe https://rolesanywhere.amazonaws.com/releases/1.6.0/X86%5F64/Windows/aws%5Fsigning%5Fhelper.exe

# Verify checksum (optional)
# Expected SHA256: 83d116ad1100ae56746020497df6c612dfce4c235012f328cff096581ebd20c9
```

### 2. Certificate Setup

Place your X.509 certificates in the `certs/` directory:

- `certs/client.pem` - Your client certificate
- `certs/client.key` - Your private key

### 3. Environment Configuration

Copy the example environment file and configure it:

```powershell
cp env.example .env
```

Edit `.env` and set your AWS configuration:

```bash
# Enable AWS Roles Anywhere
AWS_ROLES_ANYWHERE_ENABLED=true

# AWS Configuration
AWS_REGION=us-east-1

# Your AWS Roles Anywhere ARNs
AWS_ROLES_ANYWHERE_PROFILE_ARN=arn:aws:rolesanywhere:us-east-1:123456789012:profile/your-profile-id
AWS_ROLES_ANYWHERE_ROLE_ARN=arn:aws:iam::123456789012:role/YourRoleName
AWS_ROLES_ANYWHERE_TRUST_ANCHOR_ARN=arn:aws:rolesanywhere:us-east-1:123456789012:trust-anchor/your-trust-anchor-id

# Certificate paths
AWS_CERTIFICATE_PATH=./certs/client.pem
AWS_PRIVATE_KEY_PATH=./certs/client.key
```

## 🚀 Usage

### Running the Service

```powershell
# Development
pnpm run dev

# Production build and run
pnpm run build:prod
pnpm run start:prod
```

### AWS Credential Methods

The service supports three credential management methods:

#### 1. **Background Update (Default)**

- Continuously updates `~/.aws/credentials` file
- Best for long-running services
- Automatic credential rotation

#### 2. **Credential Server**

- Mimics EC2 instance metadata service
- Runs on `http://localhost:1338`
- Perfect for applications expecting EC2-like environment

#### 3. **Direct Process**

- Gets credentials on-demand
- Best for short-lived processes
- Direct integration with AWS SDK

### Testing Credentials

You can test the credential functionality:

```typescript
import { AWSService } from './src/core/services/aws.service';

const awsService = new AWSService();

// Test credential retrieval
const credentials = await awsService.getCredentials();
console.log('Credentials expire at:', credentials.Expiration);

// Check status
console.log('AWS Status:', awsService.getStatus());
```

## 🔧 Configuration Options

| Environment Variable                  | Description                    | Default                          |
| ------------------------------------- | ------------------------------ | -------------------------------- |
| `AWS_ROLES_ANYWHERE_ENABLED`          | Enable/disable AWS integration | `false`                          |
| `AWS_REGION`                          | AWS region                     | `us-east-1`                      |
| `AWS_ROLES_ANYWHERE_PROFILE_ARN`      | Roles Anywhere profile ARN     | Required                         |
| `AWS_ROLES_ANYWHERE_ROLE_ARN`         | IAM role ARN to assume         | Required                         |
| `AWS_ROLES_ANYWHERE_TRUST_ANCHOR_ARN` | Trust anchor ARN               | Required                         |
| `AWS_CERTIFICATE_PATH`                | Path to client certificate     | `./certs/client.pem`             |
| `AWS_PRIVATE_KEY_PATH`                | Path to private key            | `./certs/client.key`             |
| `AWS_CREDENTIAL_HELPER_PATH`          | Path to credential helper      | `./tools/aws_signing_helper.exe` |
| `AWS_SESSION_DURATION`                | Session duration in seconds    | `3600` (1 hour)                  |
| `AWS_PROFILE_NAME`                    | AWS profile name               | `roles-anywhere`                 |
| `AWS_CREDENTIAL_REFRESH_MINUTES`      | Refresh interval               | `30`                             |

## 🏗️ AWS Infrastructure Setup

### 1. Create Trust Anchor

```bash
aws rolesanywhere create-trust-anchor \
  --name "MyTrustAnchor" \
  --source sourceType=CERTIFICATE_BUNDLE,sourceData=data://$(base64 -w 0 ca-cert.pem)
```

### 2. Create Profile

```bash
aws rolesanywhere create-profile \
  --name "MyProfile" \
  --role-arns "arn:aws:iam::123456789012:role/MyRole"
```

### 3. IAM Role Trust Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "rolesanywhere.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

## 🧪 Testing

### Manual Testing with Credential Helper

```powershell
# Test credential-process
./tools/aws_signing_helper.exe credential-process `
  --certificate ./certs/client.pem `
  --private-key ./certs/client.key `
  --trust-anchor-arn arn:aws:rolesanywhere:region:account:trust-anchor/TA_ID `
  --profile-arn arn:aws:rolesanywhere:region:account:profile/PROFILE_ID `
  --role-arn arn:aws:iam::account:role/role-name

# Test update once
./tools/aws_signing_helper.exe update `
  --certificate ./certs/client.pem `
  --private-key ./certs/client.key `
  --trust-anchor-arn arn:aws:rolesanywhere:region:account:trust-anchor/TA_ID `
  --profile-arn arn:aws:rolesanywhere:region:account:profile/PROFILE_ID `
  --role-arn arn:aws:iam::account:role/role-name `
  --once
```

## 🔒 Security Best Practices

1. **Certificate Security**

   - Store private keys securely
   - Use proper file permissions (600 for private keys)
   - Rotate certificates regularly

2. **IAM Permissions**

   - Follow principle of least privilege
   - Use specific resource ARNs when possible
   - Regular audit of permissions

3. **Session Duration**
   - Use shortest duration necessary
   - Consider business requirements
   - Monitor session usage

## 🚨 Troubleshooting

### Common Issues

1. **Certificate not found**

   ```
   Certificate file not found at: ./certs/client.pem
   ```

   - Ensure certificate files exist in correct location
   - Check file permissions

2. **Invalid ARN format**

   ```
   Missing required AWS Roles Anywhere configuration
   ```

   - Verify all ARNs are correct
   - Check environment variables are set

3. **Permission denied**
   ```
   Failed to get credentials via credential-process
   ```
   - Verify IAM role has necessary permissions
   - Check trust relationship
   - Ensure profile allows the role

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug
```

### Status Check

Check AWS service status:

```typescript
const status = awsService.getStatus();
console.log(JSON.stringify(status, null, 2));
```

## 📚 Additional Resources

- [AWS IAM Roles Anywhere Documentation](https://docs.aws.amazon.com/rolesanywhere/latest/userguide/credential-helper.html)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/)
- [Credential Helper GitHub Repository](https://github.com/aws/rolesanywhere-credential-helper)

## 🤝 Integration with Other AWS Services

Once credentials are set up, you can use them with any AWS SDK:

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { fromProcess } from '@aws-sdk/credential-providers';

const client = new DynamoDBClient({
  region: 'us-east-1',
  credentials: fromProcess({
    // Uses the credential helper automatically
  }),
});
```
