import { ChildProcess, exec } from 'child_process';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { dirname, join } from 'path';
import { resolve } from 'path';
import { promisify } from 'util';

import { config } from '@/config';

const execAsync = promisify(exec);

export interface RolesAnywhereCredentials {
  Version: number;
  AccessKeyId: string;
  SecretAccessKey: string;
  SessionToken: string;
  Expiration: string;
}

interface ManualCredentials {
  AccessKeyId: string;
  SecretAccessKey: string;
  SessionToken: string;
  Expiration: string;
}

export class AWSRolesAnywhereManager {
  private credentialsFilePath: string;
  private updateProcess: ChildProcess | null = null;
  private serveProcess: ChildProcess | null = null;
  private isUpdateRunning: boolean = false;
  private isServeRunning: boolean = false;
  private serverPort: number = 1338;

  constructor() {
    this.credentialsFilePath = join(homedir(), '.aws', 'credentials');
    this.ensureAwsDirectory();
  }

  private ensureAwsDirectory(): void {
    const awsDir = dirname(this.credentialsFilePath);
    if (!existsSync(awsDir)) {
      mkdirSync(awsDir, { recursive: true });
    }
  }

  private validateConfiguration(): void {
    if (!config.aws.enabled) {
      throw new Error(
        'AWS Roles Anywhere is not enabled. Set AWS_ROLES_ANYWHERE_ENABLED=true',
      );
    }

    const required = ['profileArn', 'roleArn', 'trustAnchorArn'];
    const missing = required.filter(
      (key) => !config.aws[key as keyof typeof config.aws],
    );

    if (missing.length > 0) {
      throw new Error(
        `Missing required AWS Roles Anywhere configuration: ${missing.join(', ')}`,
      );
    }

    if (!existsSync(config.aws.credentialHelperPath)) {
      throw new Error(
        `AWS credential helper not found at: ${config.aws.credentialHelperPath}`,
      );
    }

    if (config.aws.certificatePath && !existsSync(config.aws.certificatePath)) {
      throw new Error(
        `Certificate file not found at: ${config.aws.certificatePath}`,
      );
    }

    if (config.aws.privateKeyPath && !existsSync(config.aws.privateKeyPath)) {
      throw new Error(
        `Private key file not found at: ${config.aws.privateKeyPath}`,
      );
    }
  }

  private buildBaseCommand(): string[] {
    const cmd = [
      resolve(config.aws.credentialHelperPath),
      '--trust-anchor-arn',
      config.aws.trustAnchorArn!,
      '--profile-arn',
      config.aws.profileArn!,
      '--role-arn',
      config.aws.roleArn!,
      '--region',
      config.aws.region,
      '--session-duration',
      config.aws.sessionDuration.toString(),
    ];

    if (config.aws.certificatePath) {
      cmd.push('--certificate', config.aws.certificatePath);
    }

    if (config.aws.privateKeyPath) {
      cmd.push('--private-key', config.aws.privateKeyPath);
    }

    return cmd;
  }

  /**
   * Method 1: Use credential-process for direct SDK integration
   * This method returns credentials directly and is perfect for SDK integration
   */
  async getCredentialsViaProcess(): Promise<RolesAnywhereCredentials> {
    this.validateConfiguration();

    const command = [...this.buildBaseCommand(), 'credential-process'].join(
      ' ',
    );

    try {
      console.log('🔄 Fetching credentials via credential-process...');
      const { stdout, stderr } = await execAsync(command);

      if (stderr) {
        console.warn('Credential process stderr:', stderr);
      }

      const credentials = JSON.parse(stdout.trim());
      console.log('✅ Credentials fetched successfully');

      return credentials;
    } catch (error) {
      console.error(
        '❌ Failed to get credentials via credential-process:',
        error,
      );
      throw new Error(
        `Failed to get credentials via credential-process: ${error}`,
      );
    }
  }

  /**
   * Method 2: Start background credential update process
   * This continuously updates the ~/.aws/credentials file
   */
  async startCredentialUpdate(): Promise<void> {
    this.validateConfiguration();

    if (this.isUpdateRunning) {
      console.log('📝 Credential update process is already running');
      return;
    }

    const command = [
      ...this.buildBaseCommand(),
      'update',
      '--profile',
      config.aws.profileName,
    ].join(' ');

    try {
      console.log('🚀 Starting credential update process...');
      this.updateProcess = exec(command);
      this.isUpdateRunning = true;

      this.updateProcess.stdout?.on('data', (data) => {
        console.log(`📝 Credential update: ${data.toString().trim()}`);
      });

      this.updateProcess.stderr?.on('data', (data) => {
        console.error(`❌ Credential update error: ${data.toString().trim()}`);
      });

      this.updateProcess.on('close', (code) => {
        console.log(`📝 Credential update process exited with code ${code}`);
        this.isUpdateRunning = false;
        this.updateProcess = null;
      });

      this.updateProcess.on('error', (error) => {
        console.error(`❌ Credential update process error: ${error}`);
        this.isUpdateRunning = false;
        this.updateProcess = null;
      });

      // Give it time to write initial credentials
      await new Promise((resolve) => setTimeout(resolve, 3000));
      console.log('✅ Credential update process started');
    } catch (error) {
      this.isUpdateRunning = false;
      throw new Error(`Failed to start credential update process: ${error}`);
    }
  }

  /**
   * Method 3: Update credentials once
   */
  async updateCredentialsOnce(): Promise<void> {
    this.validateConfiguration();

    const command = [
      ...this.buildBaseCommand(),
      'update',
      '--profile',
      config.aws.profileName,
      '--once',
    ].join(' ');

    try {
      console.log('🔄 Updating credentials once...');
      const { stdout, stderr } = await execAsync(command);

      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);

      console.log('✅ Credentials updated successfully');
    } catch (error) {
      throw new Error(`Failed to update credentials: ${error}`);
    }
  }

  /**
   * Method 4: Start credential server (mimics EC2 metadata service)
   */
  async startCredentialServer(): Promise<void> {
    this.validateConfiguration();

    if (this.isServeRunning) {
      console.log('🌐 Credential server is already running');
      return;
    }

    const command = [
      ...this.buildBaseCommand(),
      'serve',
      '--port',
      this.serverPort.toString(),
    ].join(' ');

    try {
      console.log(
        `🚀 Starting credential server on port ${this.serverPort}...`,
      );
      this.serveProcess = exec(command);
      this.isServeRunning = true;

      this.serveProcess.stdout?.on('data', (data) => {
        console.log(`🌐 Credential server: ${data.toString().trim()}`);
      });

      this.serveProcess.stderr?.on('data', (data) => {
        console.error(`❌ Credential server error: ${data.toString().trim()}`);
      });

      this.serveProcess.on('close', (code) => {
        console.log(`🌐 Credential server exited with code ${code}`);
        this.isServeRunning = false;
        this.serveProcess = null;
      });

      this.serveProcess.on('error', (error) => {
        console.error(`❌ Credential server error: ${error}`);
        this.isServeRunning = false;
        this.serveProcess = null;
      });

      // Give the server time to start
      await new Promise((resolve) => setTimeout(resolve, 3000));
      console.log(
        `✅ Credential server started on http://localhost:${this.serverPort}`,
      );
    } catch (error) {
      this.isServeRunning = false;
      throw new Error(`Failed to start credential server: ${error}`);
    }
  }

  /**
   * Read credentials from the AWS credentials file
   */
  getCredentialsFromFile(): ManualCredentials | null {
    if (!existsSync(this.credentialsFilePath)) {
      return null;
    }

    try {
      const content = readFileSync(this.credentialsFilePath, 'utf8');
      const profileSection = new RegExp(
        `\\[${config.aws.profileName}\\]([\\s\\S]*?)(?=\\[|$)`,
      );
      const match = content.match(profileSection);

      if (!match) {
        return null;
      }

      const section = match[1];
      const accessKeyMatch = section.match(/aws_access_key_id\s*=\s*(.+)/);
      const secretKeyMatch = section.match(/aws_secret_access_key\s*=\s*(.+)/);
      const sessionTokenMatch = section.match(/aws_session_token\s*=\s*(.+)/);
      const expirationMatch = section.match(
        /aws_credential_expiration\s*=\s*(.+)/,
      );

      if (
        accessKeyMatch &&
        secretKeyMatch &&
        sessionTokenMatch &&
        expirationMatch
      ) {
        return {
          AccessKeyId: accessKeyMatch[1].trim(),
          SecretAccessKey: secretKeyMatch[1].trim(),
          SessionToken: sessionTokenMatch[1].trim(),
          Expiration: expirationMatch[1].trim(),
        };
      }

      return null;
    } catch (error) {
      console.error('Error reading credentials file:', error);
      return null;
    }
  }

  /**
   * Check if credentials are valid (not expired)
   */
  areCredentialsValid(bufferMinutes: number = 5): boolean {
    const credentials = this.getCredentialsFromFile();
    if (!credentials) {
      return false;
    }

    const now = new Date();
    const expiration = new Date(credentials.Expiration);
    const bufferTime = new Date(
      expiration.getTime() - bufferMinutes * 60 * 1000,
    );

    return now < bufferTime;
  }

  /**
   * Stop all running processes
   */
  async stopAllProcesses(): Promise<void> {
    const promises: Promise<void>[] = [];

    if (this.updateProcess && this.isUpdateRunning) {
      promises.push(
        new Promise<void>((resolve) => {
          this.updateProcess!.kill('SIGTERM');
          this.updateProcess!.on('close', () => {
            console.log('📝 Credential update process stopped');
            this.isUpdateRunning = false;
            this.updateProcess = null;
            resolve();
          });
        }),
      );
    }

    if (this.serveProcess && this.isServeRunning) {
      promises.push(
        new Promise<void>((resolve) => {
          this.serveProcess!.kill('SIGTERM');
          this.serveProcess!.on('close', () => {
            console.log('🌐 Credential server stopped');
            this.isServeRunning = false;
            this.serveProcess = null;
            resolve();
          });
        }),
      );
    }

    await Promise.all(promises);
  }

  /**
   * Get server URL for manual HTTP requests
   */
  getServerUrl(): string {
    return `http://localhost:${this.serverPort}`;
  }

  /**
   * Status check
   */
  getStatus() {
    return {
      updateProcessRunning: this.isUpdateRunning,
      serverRunning: this.isServeRunning,
      credentialsValid: this.areCredentialsValid(),
      serverUrl: this.getServerUrl(),
      configValid: config.aws.enabled,
    };
  }
}
