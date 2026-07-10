import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser, OrgId } from './decorators/current-user.decorator';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

@ApiTags('Auth')
@Controller('auth')
@UseGuards(AuthGuard)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @Public()
  @ApiOperation({ summary: 'Create account and organization' })
  async signup(@Body() body: { name: string; email: string; password: string; orgName: string; businessType: string }, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.signup(body);
    res.cookie('revorax.session_token', result.sessionToken, COOKIE_OPTIONS);
    return { success: true, user: result.user, org: result.org };
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login to existing account' })
  async login(@Body() body: { email: string; password: string }, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(body.email, body.password);
    res.cookie('revorax.session_token', result.sessionToken, COOKIE_OPTIONS);
    return { success: true, user: result.user, org: result.org };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and clear session' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.['revorax.session_token'];
    if (token) await this.authService.logout(token);
    res.clearCookie('revorax.session_token', { path: '/' });
    return { success: true };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user and organization' })
  async me(@CurrentUser() user: { id: string }) {
    return this.authService.getMe(user.id);
  }

  @Post('invite')
  @ApiOperation({ summary: 'Invite a team member' })
  async invite(@OrgId() orgId: string, @Body() body: { email: string; role: string }) {
    return this.authService.inviteUser(orgId, body.email, body.role as any);
  }

  @Post('invite/accept')
  @Public()
  @ApiOperation({ summary: 'Accept a team invite' })
  async acceptInvite(@Body() body: { token: string; name: string; password: string }, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.acceptInvite(body.token, body.name, body.password);
    res.cookie('revorax.session_token', result.sessionToken, COOKIE_OPTIONS);
    return { success: true, user: result.user, org: result.org };
  }

  @Post('forgot-password')
  @Public()
  @ApiOperation({ summary: 'Send password reset link' })
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @Public()
  @ApiOperation({ summary: 'Reset password using token' })
  async resetPassword(@Body() body: { token: string; password: string }) {
    return this.authService.resetPassword(body.token, body.password);
  }
}
