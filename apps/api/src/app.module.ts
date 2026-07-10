import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './modules/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { LeadsModule } from './modules/leads/leads.module';
import { MembersModule } from './modules/members/members.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { NotesModule } from './modules/notes/notes.module';
import { MessagesModule } from './modules/messages/messages.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { AiModule } from './modules/ai/ai.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { BillingModule } from './modules/billing/billing.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { AuditModule } from './modules/audit/audit.module';
import { PatientsModule } from './modules/patients/patients.module';
import { ClientsModule } from './modules/clients/clients.module';

import { AppController } from './app.controller';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    OrganizationsModule,
    ContactsModule,
    LeadsModule,
    MembersModule,
    PatientsModule,
    ClientsModule,
    TasksModule,
    NotesModule,
    MessagesModule,
    TemplatesModule,
    CampaignsModule,
    AiModule,
    AnalyticsModule,
    BillingModule,
    WebhooksModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
})
export class AppModule {}
