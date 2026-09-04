import { createLogger } from '@platform/logger';

const logger = createLogger({ service: 'auth-service:phone-otp' });

/**
 * Generate a random 6-digit OTP
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Validate phone number in E.164 format
 * Valid format: +[country code][number] (e.g., +84912345678, +1234567890)
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  const e164Regex = /^\+\d{1,15}$/;
  return e164Regex.test(phoneNumber);
}

/**
 * Generate Redis key for OTP storage
 * Key format: otp:{phoneNumber}
 */
export function generateOtpKey(phoneNumber: string): string {
  return `otp:${phoneNumber}`;
}

/**
 * OTP data structure stored in Redis
 */
export interface OtpData {
  otp: string;
  phoneNumber: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Create OTP data object with 5-minute TTL
 */
export function createOtpData(phoneNumber: string, otp: string): OtpData {
  const now = Date.now();
  const ttlSeconds = 5 * 60; // 5 minutes

  return {
    otp,
    phoneNumber,
    createdAt: now,
    expiresAt: now + ttlSeconds * 1000,
  };
}

/**
 * Check if OTP has expired
 */
export function isOtpExpired(otpData: OtpData): boolean {
  return Date.now() > otpData.expiresAt;
}

/**
 * Mock SMS sending for development
 * In production, integrate with Twilio, Firebase, SpeedSMS, etc.
 */
export async function sendOtpSms(phoneNumber: string, otp: string): Promise<void> {
  // Development: Log OTP to console
  logger.info(`[MOCK SMS] Sending OTP to ${phoneNumber}: ${otp}`);
  
  // TODO: Implement real SMS provider
  // Example with Twilio:
  // const twilio = require('twilio');
  // const client = twilio(accountSid, authToken);
  // await client.messages.create({
  //   body: `Your OTP is: ${otp}`,
  //   from: process.env.TWILIO_PHONE,
  //   to: phoneNumber,
  // });
}
