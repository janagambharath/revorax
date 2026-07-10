import { Module, Global } from '@nestjs/common';
import { prisma } from '@revorax/database';

@Global()
@Module({
  providers: [
    {
      provide: 'PRISMA',
      useValue: prisma,
    },
  ],
  exports: ['PRISMA'],
})
export class DatabaseModule {}
