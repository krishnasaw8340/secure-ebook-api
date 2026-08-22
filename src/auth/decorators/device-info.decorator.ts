import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { DeviceMetadata } from '../interfaces/device-metadata.interface';

export function parseDeviceName(userAgent?: string): string {
    if (!userAgent) return 'Unknown Device';

    let os = 'Unknown OS';
    if (/windows phone/i.test(userAgent)) os = 'Windows Phone';
    else if (/win/i.test(userAgent)) os = 'Windows';
    else if (/android/i.test(userAgent)) os = 'Android';
    else if (/iphone|ipad|ipod/i.test(userAgent)) os = 'iOS';
    else if (/mac/i.test(userAgent)) os = 'macOS';
    else if (/linux/i.test(userAgent)) os = 'Linux';

    let browser = 'Unknown Browser';
    if (/edg/i.test(userAgent)) browser = 'Edge';
    else if (/opr|opera/i.test(userAgent)) browser = 'Opera';
    else if (/chrome|crios/i.test(userAgent)) browser = 'Chrome';
    else if (/firefox|fxios/i.test(userAgent)) browser = 'Firefox';
    else if (/safari/i.test(userAgent)) browser = 'Safari';
    else if (/postman/i.test(userAgent)) browser = 'Postman';
    else if (/curl/i.test(userAgent)) browser = 'cURL';

    return `${browser} on ${os}`;
}

export const DeviceInfo = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): DeviceMetadata => {
        const req = ctx.switchToHttp().getRequest<Request>();

        const forwarded = req.headers['x-forwarded-for'];
        let ipAddress: string | undefined;
        if (typeof forwarded === 'string') {
            ipAddress = forwarded.split(',')[0].trim();
        } else if (Array.isArray(forwarded)) {
            ipAddress = forwarded[0];
        } else {
            ipAddress = req.ip || req.socket?.remoteAddress;
        }

        // Clean IPv6 mapped IPv4 (e.g. ::ffff:127.0.0.1 -> 127.0.0.1)
        if (ipAddress?.startsWith('::ffff:')) {
            ipAddress = ipAddress.replace('::ffff:', '');
        }

        const userAgent = (req.headers['user-agent'] as string) || undefined;
        const customDeviceName =
            (req.headers['x-device-name'] as string) ||
            (req.body?.deviceName as string);
        const deviceName =
            customDeviceName || (userAgent ? parseDeviceName(userAgent) : 'Unknown Device');

        return {
            ipAddress,
            userAgent,
            deviceName,
        };
    },
);
