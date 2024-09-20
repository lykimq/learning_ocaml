# `digestif` hash algorithms

| Algorithm    | Bit Length | Speed      | Security     | Best Use Case                                          |
|--------------|------------|------------|--------------|-------------------------------------------------------|
| **MD5**      | 128 bits   | Fast       | Weak         | Checksums, non-cryptographic integrity checks          |
| **SHA1**     | 160 bits   | Moderate   | Weak         | Legacy systems, compatibility purposes                 |
| **SHA224**   | 224 bits   | Moderate   | Secure       | Shorter hashes for limited space, moderate security    |
| **SHA256**   | 256 bits   | Moderate   | Strong       | General-purpose cryptography, blockchain, digital sig. |
| **SHA384**   | 384 bits   | Slower     | Very Strong  | Enhanced security for sensitive data                   |
| **SHA512**   | 512 bits   | Slower     | Very Strong  | High-security applications, cryptographic protocols    |
| **BLAKE2B**  | 256-512 bits | Very Fast | Strong       | Password hashing, general-purpose cryptographic use    |
| **BLAKE2S**  | 128-256 bits | Very Fast | Strong       | Lightweight systems, fast hashing on 32-bit platforms  |
| **SHA3_224** | 224 bits   | Moderate   | Very Strong  | Modern cryptography with smaller hash size             |
| **SHA3_256** | 256 bits   | Moderate   | Very Strong  | General cryptographic hashing, digital signatures      |
| **SHA3_384** | 384 bits   | Slower     | Very Strong  | High-security cryptography, digital signatures         |
| **SHA3_512** | 512 bits   | Slower     | Very Strong  | High-security, long-lived cryptographic applications   |
| **Keccak_224** | 224 bits | Moderate   | Strong       | Similar to SHA3-224 but for specific cryptographic use |
| **Keccak_256** | 256 bits | Moderate   | Strong       | Pre-standard SHA3-256, blockchain, cryptography        |
| **Keccak_384** | 384 bits | Slower     | Strong       | Pre-standard SHA3-384, secure protocols                |
| **Keccak_512** | 512 bits | Slower     | Strong       | Pre-standard SHA3-512, secure communication protocols  |
| **RIPEMD160** | 160 bits  | Moderate   | Moderate     | Bitcoin, blockchain, cryptographic systems             |

Summary:
- MD5 and SHA1: Fast but insecure, used in non-cryptographic contexts or for
  legacy compatibility.
- SHA-2 family (SHA224, SHA256, SHA384, SHA512): strong security, widely used
  for modern cryptographic applications.
- BLAKE2 (BLAKE2B, BLAKE2S): Optimized for speed, especially useful in password
  hashing or for fast cryptographic needs.
- SHA-3 family (SHA3_224, SHA3_256, SHA3_384, SHA3_512): High-security
  algorithms suitable for morden cryptographic needs.
- Keccak: Pre-standard version of SHA-3, useful for specific applications
  needing backward compatibility.
- RIPEMD160: Common in cryptocurrency (e.g., Bitcoin) but less widely used
  outside of blockchain applications.

