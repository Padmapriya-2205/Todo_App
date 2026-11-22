import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export interface AuthUser { sub: string; username: string }
export const CurrentUser = createParamDecorator((_: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<{ user: AuthUser }>();
  return request.user;
});
