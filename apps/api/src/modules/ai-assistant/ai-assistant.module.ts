import { Module } from '@nestjs/common';
import { ConfisysModule } from '../confisys/confisys.module';
import { AiAssistantController } from './ai-assistant.controller';
import { AiAssistantService } from './ai-assistant.service';
import { OllamaProviderService } from './ollama-provider.service';

@Module({
  imports: [ConfisysModule],
  controllers: [AiAssistantController],
  providers: [AiAssistantService, OllamaProviderService],
  exports: [AiAssistantService]
})
export class AiAssistantModule {}
