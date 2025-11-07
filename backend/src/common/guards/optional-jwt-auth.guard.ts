import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT Auth Guard
 * Allows requests to pass through even if JWT token is not present or invalid
 * The user object will be attached to the request if token is valid, otherwise request.user will be undefined
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // No error thrown if user is not authenticated
    // Simply return user (which will be undefined if not authenticated)
    return user;
  }
}
