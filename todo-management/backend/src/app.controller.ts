import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'API health check', description: 'Returns the API greeting.' })
  @ApiOkResponse({ description: 'API is responding.', schema: { type: 'string', example: 'Hello World!' } })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
