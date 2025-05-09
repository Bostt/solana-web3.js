import { SOLANA_ERROR__CRYPTO__RANDOM_VALUES_FUNCTION_UNIMPLEMENTED, SolanaError } from '@solana/errors';

/**
 * Throws an exception unless {@link Crypto#getRandomValues | `crypto.getRandomValues()`} is
 * available in the current JavaScript environment.
 */
export function assertPRNGIsAvailable() {
    if (typeof globalThis.crypto === 'undefined' || typeof globalThis.crypto.getRandomValues !== 'function') {
        throw new SolanaError(SOLANA_ERROR__CRYPTO__RANDOM_VALUES_FUNCTION_UNIMPLEMENTED);
    }
}
