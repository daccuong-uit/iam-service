import { createLogger } from '@daccuong-uit/platform-logger';

const logger = createLogger({ service: 'iam-service:phone-otp' });

export interface OtpData {
  otp: string;
  phoneNumber: string;
  createdAt: number;
  expiresAt: number;
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function validatePhoneNumber(phoneNumber: string): boolean {
  return /^\+\d{1,15}$/.test(phoneNumber);
}

export function generateOtpKey(phoneNumber: string): string {
  return `otp:${phoneNumber}`;
}

export function createOtpData(phoneNumber: string, otp: string): OtpData {
  const createdAt = Date.now();
  return { otp, phoneNumber, createdAt, expiresAt: createdAt + 5 * 60 * 1000 };
}

export function isOtpExpired(otpData: OtpData): boolean {
  return Date.now() > otpData.expiresAt;
}

export async function sendOtpSms(phoneNumber: string, otp: string): Promise<void> {
  logger.info(`[MOCK SMS] Sending OTP to ${phoneNumber}: ${otp}`);
}