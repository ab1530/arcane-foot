import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to check resource ownership
 * @param paramName - The name of the parameter containing the resource ID (default: 'userId')
 * @param resourceType - The type of resource: 'user', 'player', 'club' (default: 'user')
 */
export const CheckOwnership = (paramName: string = 'userId', resourceType: string = 'user') => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata('ownershipParam', paramName)(target, propertyKey, descriptor);
    SetMetadata('resourceType', resourceType)(target, propertyKey, descriptor);
  };
};
