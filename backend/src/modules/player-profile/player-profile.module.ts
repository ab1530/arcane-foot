import { Module } from '@nestjs/common';
import { PlayerProfileController, InternalPlayerProfileController } from './player-profile.controller';
import { PlayerProfileService } from './player-profile.service';

@Module({
  controllers: [PlayerProfileController, InternalPlayerProfileController],
  providers: [PlayerProfileService],
  exports: [PlayerProfileService],
})
export class PlayerProfileModule {}
