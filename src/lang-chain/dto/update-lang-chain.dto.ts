import { PartialType } from '@nestjs/mapped-types';
import { CreateLangChainDto } from './create-lang-chain.dto';

export class UpdateLangChainDto extends PartialType(CreateLangChainDto) {}
