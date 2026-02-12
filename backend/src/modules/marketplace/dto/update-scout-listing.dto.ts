import { PartialType } from '@nestjs/swagger';
import { CreateScoutListingDto } from './create-scout-listing.dto';

export class UpdateScoutListingDto extends PartialType(CreateScoutListingDto) {}
