import 'dotenv/config';

import { App } from 'cdktf';

import { EcrStack } from './stacks';

const app = new App();

new EcrStack(app, 'ecr-stack');

app.synth();
