import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

const ALGORITHM = "aes-256-gcm"
const KEY_HEX = process.env.TOKEN_ENCRYPTION_KEY ?? ""

function getKey(): Buffer {
  if (!KEY_HEX || KEY_HEX.length !== 64) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)")
  }
  return Buffer.from(KEY_HEX, "hex")
}

export function encryptToken(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  // Format: iv:tag:ciphertext (all hex)
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`
}

export function decryptToken(value: string): string {
  // Graceful fallback: if value doesn't match our format, it's a legacy plaintext token
  const parts = value.split(":")
  if (parts.length !== 3) return value

  try {
    const key = getKey()
    const [ivHex, tagHex, encryptedHex] = parts
    const iv = Buffer.from(ivHex, "hex")
    const tag = Buffer.from(tagHex, "hex")
    const encrypted = Buffer.from(encryptedHex, "hex")
    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    return decipher.update(encrypted) + decipher.final("utf8")
  } catch {
    // Decryption failed — treat as plaintext (handles edge cases during migration)
    return value
  }
}
