/**
 * 密码本加密模块
 *
 * ## 架构
 * - 密钥派生: PBKDF2-HMAC-SHA256, 100000 轮, 输出 64 字节
 * - 前 32 字节 → AES-256-CTR 加密密钥 (encKey)
 * - 后 32 字节 → HMAC-SHA256 认证密钥 (macKey)
 * - 加密模式: Encrypt-then-MAC (先加密, 再对 iv+ciphertext+version 做 HMAC)
 * - 密钥存储: expo-secure-store
 *
 * ## 安全设计
 * - encKey 与 macKey 分离, 杜绝同一 key 两份用途的风险
 * - IV 每次加密随机生成 (ExpoCrypto.getRandomBytesAsync)
 * - 解密前先校验 HMAC, 使用常量时间比较
 * - HMAC 覆盖 version tag + iv + ciphertext
 * - PIN 验证使用常量时间比较
 * - 冷却锁定持久化 (SecureStore), 关闭 App 后仍有效
 *
 * ## Why not AES-GCM
 * - 纯 JS 的 AES-GCM 实现在 Hermes 环境中稳定性不足
 * - AES-256-CTR + HMAC-SHA256 (Encrypt-then-MAC) 提供认证加密等同 GCM
 * - Encrypt-then-MAC 是学界公认的构造方式, 安全性经充分验证
 */

import * as SecureStore from 'expo-secure-store';
import * as ExpoCrypto from 'expo-crypto';
import { Counter, ModeOfOperation } from 'aes-js';

// ---- 常量 ----
/** 加密格式版本, 嵌入 HMAC 以防降级攻击 */
const ENC_VERSION = 1;
const PBKDF2_ITERATIONS = 100000;
/** 派生总长度: 32 (encKey) + 32 (macKey) */
const DERIVED_KEY_LENGTH = 64;
const ENC_KEY_LENGTH = 32;
const MAC_KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const IV_LENGTH = 16;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000;

// SecureStore keys (带 v2 后缀标识新架构)
const SS_PIN_SALT = 'pin_salt_v2';
const SS_PIN_HASH = 'pin_hash_v2';
const SS_LOCKOUT_UNTIL = 'lockout_until_v2';
const SS_FAILED_ATTEMPTS = 'failed_attempts_v2';

// ---- SHA-256 纯 JS 实现 ----
function sha256(message: Uint8Array): Uint8Array {
  const H = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98,
    0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8,
    0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819,
    0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
    0xc67178f2,
  ]);

  const len = message.length;
  const ml = len * 8;
  let offset = 0;
  const paddedLen = ((len + 9 + 63) >>> 6) << 6;
  const padded = new Uint8Array(paddedLen);
  padded.set(message);
  padded[len] = 0x80;
  new DataView(padded.buffer).setUint32(paddedLen - 4, ml >>> 32, false);
  new DataView(padded.buffer).setUint32(paddedLen - 8, ml & 0xffffffff, false);

  const W = new Uint32Array(64);
  while (offset < paddedLen) {
    for (let t = 0; t < 16; t++) {
      const i = offset + t * 4;
      W[t] = (padded[i] << 24) | (padded[i + 1] << 16) | (padded[i + 2] << 8) | padded[i + 3];
    }
    for (let t = 16; t < 64; t++) {
      const s0 = ror(W[t - 15], 7) ^ ror(W[t - 15], 18) ^ (W[t - 15] >>> 3);
      const s1 = ror(W[t - 2], 17) ^ ror(W[t - 2], 19) ^ (W[t - 2] >>> 10);
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) >>> 0;
    }
    let a = H[0],
      b = H[1],
      c = H[2],
      d = H[3];
    let e = H[4],
      f = H[5],
      g = H[6],
      h = H[7];
    for (let t = 0; t < 64; t++) {
      const S1 = ror(e, 6) ^ ror(e, 11) ^ ror(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[t] + W[t]) >>> 0;
      const S0 = ror(a, 2) ^ ror(a, 13) ^ ror(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0;
    H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0;
    H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0;
    H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0;
    H[7] = (H[7] + h) >>> 0;
    offset += 64;
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 8; i++) {
    out[i * 4] = H[i] >>> 24;
    out[i * 4 + 1] = (H[i] >>> 16) & 0xff;
    out[i * 4 + 2] = (H[i] >>> 8) & 0xff;
    out[i * 4 + 3] = H[i] & 0xff;
  }
  return out;
}

function ror(x: number, n: number): number {
  return (x >>> n) | (x << (32 - n));
}

// ---- HMAC-SHA256 ----
function hmacSha256(key: Uint8Array, data: Uint8Array): Uint8Array {
  const blockSize = 64;
  if (key.length > blockSize) key = sha256(key);
  if (key.length < blockSize) {
    const padded = new Uint8Array(blockSize);
    padded.set(key);
    key = padded;
  }
  const ipad = new Uint8Array(blockSize);
  const opad = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    ipad[i] = key[i] ^ 0x36;
    opad[i] = key[i] ^ 0x5c;
  }
  const inner = new Uint8Array(ipad.length + data.length);
  inner.set(ipad);
  inner.set(data, ipad.length);
  const innerHash = sha256(inner);
  const outer = new Uint8Array(opad.length + innerHash.length);
  outer.set(opad);
  outer.set(innerHash, opad.length);
  return sha256(outer);
}

// ---- PBKDF2-HMAC-SHA256 ----
function pbkdf2(password: string, salt: Uint8Array, iterations: number, dkLen: number): Uint8Array {
  const pwdBytes = new TextEncoder().encode(password);
  const hLen = 32;
  const blocks = Math.ceil(dkLen / hLen);
  const result = new Uint8Array(blocks * hLen);
  for (let block = 1; block <= blocks; block++) {
    const blockBytes = new Uint8Array(4);
    blockBytes[0] = (block >>> 24) & 0xff;
    blockBytes[1] = (block >>> 16) & 0xff;
    blockBytes[2] = (block >>> 8) & 0xff;
    blockBytes[3] = block & 0xff;
    const initial = new Uint8Array(salt.length + 4);
    initial.set(salt);
    initial.set(blockBytes, salt.length);
    let u = hmacSha256(pwdBytes, initial);
    let t = new Uint8Array(u);
    for (let i = 1; i < iterations; i++) {
      u = hmacSha256(pwdBytes, u);
      for (let j = 0; j < u.length; j++) t[j] ^= u[j];
    }
    result.set(t, (block - 1) * hLen);
  }
  return result.slice(0, dkLen);
}

async function getRandomBytes(length: number): Promise<Uint8Array> {
  return ExpoCrypto.getRandomBytesAsync(length);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

// ---- 密钥派生 (输出 64 字节, 分离 encKey / macKey) ----
function deriveKeys(pin: string, salt: Uint8Array): { encKey: Uint8Array; macKey: Uint8Array } {
  const derived = pbkdf2(pin, salt, PBKDF2_ITERATIONS, DERIVED_KEY_LENGTH);
  return {
    encKey: derived.slice(0, ENC_KEY_LENGTH),
    macKey: derived.slice(ENC_KEY_LENGTH, ENC_KEY_LENGTH + MAC_KEY_LENGTH),
  };
}

/**
 * 构建 HMAC 认证数据
 * 覆盖 version tag + iv + ciphertext, 防止降级攻击和参数篡改
 */
function buildAuthData(version: number, iv: Uint8Array, ciphertext: Uint8Array): Uint8Array {
  // 格式: "v{version}" + iv + ciphertext
  const versionTag = new TextEncoder().encode(`v${version}`);
  const authData = new Uint8Array(versionTag.length + iv.length + ciphertext.length);
  authData.set(versionTag);
  authData.set(iv, versionTag.length);
  authData.set(ciphertext, versionTag.length + iv.length);
  return authData;
}

// ---- 公开 API ----

/** 设置 PIN: 生成盐 → PBKDF2 派生 (64B) → 前 32B hash 存入 SecureStore */
export async function setupPin(pin: string): Promise<void> {
  const salt = await getRandomBytes(SALT_LENGTH);
  const { encKey, macKey } = deriveKeys(pin, salt);
  // 验证明文: 存储 encKey + macKey 的 SHA-256 作为 verifier
  const verifier = sha256(new Uint8Array([...encKey, ...macKey]));
  await SecureStore.setItemAsync(SS_PIN_SALT, bytesToHex(salt));
  await SecureStore.setItemAsync(SS_PIN_HASH, bytesToHex(verifier));
  await SecureStore.setItemAsync(SS_FAILED_ATTEMPTS, '0');
  await SecureStore.deleteItemAsync(SS_LOCKOUT_UNTIL);
}

/** 验证 PIN, 包含冷却期检查 */
export async function verifyPin(pin: string): Promise<boolean> {
  const remainingMs = await getLockoutRemainingMs();
  if (remainingMs > 0) {
    throw new Error(`LOCKOUT:${Date.now() + remainingMs}`);
  }

  const saltHex = await SecureStore.getItemAsync(SS_PIN_SALT);
  const verifierHex = await SecureStore.getItemAsync(SS_PIN_HASH);
  if (!saltHex || !verifierHex) return false;

  const salt = hexToBytes(saltHex);
  const storedVerifier = hexToBytes(verifierHex);
  const { encKey, macKey } = deriveKeys(pin, salt);
  const computedVerifier = sha256(new Uint8Array([...encKey, ...macKey]));

  // 常量时间比较
  if (computedVerifier.length !== storedVerifier.length) return false;
  let diff = 0;
  for (let i = 0; i < computedVerifier.length; i++) diff |= computedVerifier[i] ^ storedVerifier[i];

  if (diff === 0) {
    await SecureStore.setItemAsync(SS_FAILED_ATTEMPTS, '0');
    return true;
  }

  const attemptsStr = await SecureStore.getItemAsync(SS_FAILED_ATTEMPTS);
  const attempts = (attemptsStr ? parseInt(attemptsStr, 10) : 0) + 1;
  await SecureStore.setItemAsync(SS_FAILED_ATTEMPTS, attempts.toString());

  if (attempts >= MAX_FAILED_ATTEMPTS) {
    await SecureStore.setItemAsync(SS_LOCKOUT_UNTIL, (Date.now() + LOCKOUT_DURATION_MS).toString());
    throw new Error(`LOCKOUT:${Date.now() + LOCKOUT_DURATION_MS}`);
  }

  return false;
}

/** 获取冷却剩余毫秒数 */
export async function getLockoutRemainingMs(): Promise<number> {
  const until = await SecureStore.getItemAsync(SS_LOCKOUT_UNTIL);
  if (!until) return 0;
  const remaining = parseInt(until, 10) - Date.now();
  return remaining > 0 ? remaining : 0;
}

/** 获取剩余尝试次数 */
export async function getRemainingAttempts(): Promise<number> {
  if ((await getLockoutRemainingMs()) > 0) return 0;
  const str = await SecureStore.getItemAsync(SS_FAILED_ATTEMPTS);
  return Math.max(0, MAX_FAILED_ATTEMPTS - (str ? parseInt(str, 10) : 0));
}

/**
 * AES-256-CTR 加密 + HMAC-SHA256 认证
 *
 * 流程:
 *   1. 派生 encKey + macKey
 *   2. 随机生成 IV
 *   3. AES-256-CTR 加密 (encKey)
 *   4. HMAC-SHA256(macKey, version + iv + ciphertext)
 *   5. 返回 "v{version}:{iv}:{ciphertext}:{mac}"
 *
 * @throws 如果 PIN 未设置
 */
export async function encryptData(pin: string, plaintext: string): Promise<string> {
  const saltHex = await SecureStore.getItemAsync(SS_PIN_SALT);
  if (!saltHex) throw new Error('PIN 未设置, 无法加密');

  const salt = hexToBytes(saltHex);
  const { encKey, macKey } = deriveKeys(pin, salt);
  const iv = await getRandomBytes(IV_LENGTH);
  const plainBytes = new TextEncoder().encode(plaintext);

  const counter = new Counter(iv);
  const aesCtr = new ModeOfOperation.ctr(encKey, counter);
  const ciphertext = aesCtr.encrypt(plainBytes);

  // Encrypt-then-MAC: 对 version + iv + ciphertext 做 HMAC
  const authData = buildAuthData(ENC_VERSION, iv, ciphertext);
  const mac = hmacSha256(macKey, authData);

  return `v${ENC_VERSION}:${bytesToHex(iv)}:${bytesToHex(ciphertext)}:${bytesToHex(mac)}`;
}

/**
 * AES-256-CTR 解密 (先验证 HMAC)
 *
 * 流程:
 *   1. 解析 "v{version}:{iv}:{ciphertext}:{mac}"
 *   2. 派生 encKey + macKey
 *   3. 校验 HMAC (常量时间), 失败则抛错
 *   4. AES-256-CTR 解密
 *
 * @throws 数据认证失败 / 格式错误 / PIN 未设置
 */
export async function decryptData(pin: string, encrypted: string): Promise<string> {
  const saltHex = await SecureStore.getItemAsync(SS_PIN_SALT);
  if (!saltHex) throw new Error('PIN 未设置, 无法解密');

  const parts = encrypted.split(':');
  if (parts.length !== 4) throw new Error('加密数据格式错误');

  const [versionStr, ivHex, dataHex, macHex] = parts;
  if (!versionStr.startsWith('v')) throw new Error('不支持的加密格式');

  const version = parseInt(versionStr.slice(1), 10);
  if (version !== ENC_VERSION) throw new Error(`不支持的加密版本: ${version}`);

  const salt = hexToBytes(saltHex);
  const { encKey, macKey } = deriveKeys(pin, salt);
  const iv = hexToBytes(ivHex);
  const ciphertext = hexToBytes(dataHex);
  const storedMac = hexToBytes(macHex);

  // ---- 先校验 HMAC ----
  const authData = buildAuthData(version, iv, ciphertext);
  const computedMac = hmacSha256(macKey, authData);

  if (computedMac.length !== storedMac.length) throw new Error('数据认证失败: 数据可能已损坏');
  let macDiff = 0;
  for (let i = 0; i < computedMac.length; i++) macDiff |= computedMac[i] ^ storedMac[i];
  if (macDiff !== 0) throw new Error('数据认证失败: 数据可能已被篡改');

  // ---- HMAC 有效, 解密 ----
  const counter = new Counter(iv);
  const aesCtr = new ModeOfOperation.ctr(encKey, counter);
  const plainBytes = aesCtr.decrypt(ciphertext);

  return new TextDecoder().decode(plainBytes);
}

/** 检查 PIN 是否已设置 */
export async function isPinSetup(): Promise<boolean> {
  return !!(await SecureStore.getItemAsync(SS_PIN_HASH));
}

/** 重置 PIN (会丢失加密数据) */
export async function resetPin(): Promise<void> {
  await SecureStore.deleteItemAsync(SS_PIN_SALT);
  await SecureStore.deleteItemAsync(SS_PIN_HASH);
  await SecureStore.deleteItemAsync(SS_LOCKOUT_UNTIL);
  await SecureStore.deleteItemAsync(SS_FAILED_ATTEMPTS);
}
