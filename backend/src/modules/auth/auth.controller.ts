import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RefreshTokenService } from './services/refresh-token.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthThrottlerGuard } from '../../common/guards/auth-throttler.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  @Post('signup')
  @UseGuards(AuthThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 3 } }) // 3 attempts per minute
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'User registration', description: 'Create a new user account' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input or email already exists' })
  @ApiResponse({ status: 429, description: 'Too many requests - Rate limit exceeded' })
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('login')
  @UseGuards(AuthThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 5 } }) // 5 attempts per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login', description: 'Authenticate user and return JWT tokens' })
  @ApiResponse({ status: 200, description: 'Login successful - Returns access and refresh tokens' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests - Rate limit exceeded' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('csrf-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get CSRF token',
    description: 'Generate and return CSRF token for form submissions (production only)',
  })
  @ApiResponse({ status: 200, description: 'CSRF token generated' })
  async getCsrfToken(@Request() req) {
    // Get CSRF token generator from app
    const app = req.app;
    const generateToken = app.get('csrfTokenGenerator');

    if (!generateToken) {
      return {
        token: null,
        message: 'CSRF protection is disabled (development mode)',
      };
    }

    const csrfToken = generateToken(req, req.res);
    return {
      token: csrfToken,
      message: 'Include this token in x-csrf-token header for mutations',
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current user',
    description: 'Returns the current authenticated user',
  })
  @ApiResponse({ status: 200, description: 'Current user data returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  async getCurrentUser(@Request() req) {
    return req.user;
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update current user profile',
    description: 'Update the authenticated user profile information',
  })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, updateProfileDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generate a new access token using a valid refresh token',
  })
  @ApiResponse({ status: 200, description: 'New access token generated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or expired refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.refreshTokenService.refreshAccessToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout user',
    description: 'Revoke refresh token and blacklist current access token',
  })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  async logout(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Headers('authorization') authHeader: string,
  ) {
    // Extract access token from header
    const accessToken = authHeader?.replace('Bearer ', '');

    // Revoke refresh token
    await this.refreshTokenService.revokeRefreshToken(refreshTokenDto.refreshToken);

    // Blacklist access token for immediate logout
    if (accessToken) {
      await this.refreshTokenService.blacklistAccessToken(accessToken);
    }

    return { message: 'Logout successful' };
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout from all devices',
    description: 'Revoke all refresh tokens for the current user',
  })
  @ApiResponse({ status: 200, description: 'Logged out from all devices' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  async logoutAll(@Request() req) {
    await this.refreshTokenService.revokeAllUserTokens(req.user.id);
    return { message: 'Logged out from all devices' };
  }
}
