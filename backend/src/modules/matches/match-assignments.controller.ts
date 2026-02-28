import { Controller, Patch, Param, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MatchesService } from './matches.service';

@ApiTags('Match Assignments')
@Controller('match-assignments')
export class MatchAssignmentsController {
  constructor(private readonly matchesService: MatchesService) {}

  @Patch(':assignmentId/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Start scout mission assignment',
    description: 'Set assignment status to IN_PROGRESS for the authenticated scout owner.',
  })
  @ApiParam({ name: 'assignmentId', description: 'Assignment ID' })
  @ApiResponse({ status: 200, description: 'Assignment mission started' })
  @ApiResponse({ status: 403, description: 'Only assignment owner scout can start mission' })
  startAssignmentMission(@Param('assignmentId') assignmentId: string, @Request() req) {
    const userId = req?.user?.id ?? req?.user?.sub ?? req?.user?.userId;
    const role = req?.user?.role;
    return this.matchesService.startAssignmentMission(assignmentId, userId, role);
  }

  @Patch(':assignmentId/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Complete scout mission assignment',
    description: 'Set assignment status to COMPLETED for the authenticated scout owner.',
  })
  @ApiParam({ name: 'assignmentId', description: 'Assignment ID' })
  @ApiResponse({ status: 200, description: 'Assignment mission completed' })
  @ApiResponse({ status: 403, description: 'Only assignment owner scout can complete mission' })
  completeAssignmentMission(@Param('assignmentId') assignmentId: string, @Request() req) {
    const userId = req?.user?.id ?? req?.user?.sub ?? req?.user?.userId;
    const role = req?.user?.role;
    return this.matchesService.completeAssignmentMission(assignmentId, userId, role);
  }
}
