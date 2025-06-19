# Certificates Directory

This directory should contain your X.509 certificates for AWS IAM Roles Anywhere.

## Required Files

- `client.pem` - Your client certificate
- `client.key` - Your private key (corresponding to the client certificate)

## Security Notes

1. **Private Key Security**: Ensure your private key file has proper permissions (600 on Unix systems)
2. **Version Control**: Never commit private keys to version control
3. **Certificate Rotation**: Regularly rotate certificates according to your security policy

## Certificate Format

The credential helper supports various certificate formats:

- PEM format (recommended)
- PKCS#12 containers
- Integration with OS certificate stores (Windows CNG, macOS Keychain)
- PKCS#11 tokens and HSMs

## Example Structure

```
certs/
├── client.pem      # Your client certificate
├── client.key      # Your private key
└── ca.pem          # Certificate Authority (if needed)
```
