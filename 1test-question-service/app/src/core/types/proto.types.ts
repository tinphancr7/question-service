import { ServiceDefinition, UntypedServiceImplementation } from '@grpc/grpc-js';

export type ProtoPackage = {
  Handler: UntypedServiceImplementation;
  Definition: ServiceDefinition;
};
