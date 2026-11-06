import { amountsEqual, toMinorUnits } from './money.util';
import { hmacSha256, verifyHmacSha256 } from './signature.util';

describe('money.util', () => {
  it('compares decimals exactly', () => {
    expect(amountsEqual('4.99', '4.99')).toBe(true);
    expect(amountsEqual('5', '5.00')).toBe(true);
    expect(amountsEqual('4.99', '4.98')).toBe(false);
    expect(amountsEqual('4.99', 'abc')).toBe(false);
    expect(toMinorUnits('0.1')).toBe(10);
  });
});

describe('signature.util', () => {
  const body = Buffer.from('{"a":1}');
  const sig = hmacSha256('secret', body);

  it('accepts a valid signature and the sha256= prefix', () => {
    expect(verifyHmacSha256('secret', body, sig)).toBe(true);
    expect(verifyHmacSha256('secret', body, `sha256=${sig}`)).toBe(true);
  });

  it('rejects tampered bodies, wrong secrets and missing signatures', () => {
    expect(verifyHmacSha256('secret', Buffer.from('{"a":2}'), sig)).toBe(false);
    expect(verifyHmacSha256('other', body, sig)).toBe(false);
    expect(verifyHmacSha256('secret', body, undefined)).toBe(false);
    expect(verifyHmacSha256('secret', body, 'short')).toBe(false);
  });
});
