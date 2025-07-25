import type { Address } from '@solana/addresses';
import { pipe } from '@solana/functional';
import { Instruction } from '@solana/instructions';

import { TransactionMessageWithBlockhashLifetime } from '../blockhash';
import { createTransactionMessage } from '../create-transaction-message';
import {
    assertIsTransactionMessageWithDurableNonceLifetime,
    isTransactionMessageWithDurableNonceLifetime,
    Nonce,
    setTransactionMessageLifetimeUsingDurableNonce,
    TransactionMessageWithDurableNonceLifetime,
} from '../durable-nonce';
import { AdvanceNonceAccountInstruction } from '../durable-nonce-instruction';
import { setTransactionMessageFeePayer, TransactionMessageWithFeePayer } from '../fee-payer';
import { appendTransactionMessageInstruction } from '../instructions';
import { BaseTransactionMessage, TransactionMessage } from '../transaction-message';
import { TransactionMessageWithinSizeLimit } from '../transaction-message-size';

const mockNonceConfig = {
    nonce: null as unknown as Nonce<'nonce'>,
    nonceAccountAddress: null as unknown as Address<'nonce'>,
    nonceAuthorityAddress: null as unknown as Address<'nonceAuthority'>,
};

const newMockNonceConfig = {
    nonce: null as unknown as Nonce<'newNonce'>,
    nonceAccountAddress: null as unknown as Address<'newNonce'>,
    nonceAuthorityAddress: null as unknown as Address<'newNonceAuthority'>,
};

type InstructionA = Instruction & { identifier: 'A' };
type LegacyTransactionMessage = Extract<TransactionMessage, { version: 'legacy' }>;
type V0TransactionMessage = Extract<TransactionMessage, { version: 0 }>;

// [DESCRIBE] isTransactionMessageWithDurableNonceLifetime
{
    // It narrows the transaction message type to one with a nonce-based lifetime.
    {
        const message = null as unknown as BaseTransactionMessage & { some: 1 };
        if (isTransactionMessageWithDurableNonceLifetime(message)) {
            message satisfies BaseTransactionMessage & TransactionMessageWithDurableNonceLifetime & { some: 1 };
        } else {
            message satisfies BaseTransactionMessage & { some: 1 };
            // @ts-expect-error It does not have a nonce-based lifetime.
            message satisfies TransactionMessageWithDurableNonceLifetime;
        }
    }
}

// [DESCRIBE] assertIsTransactionMessageWithDurableNonceLifetime
{
    // It narrows the transaction message type to one with a nonce-based lifetime.
    {
        const message = null as unknown as BaseTransactionMessage & { some: 1 };
        // @ts-expect-error Should not be durable nonce lifetime
        message satisfies TransactionMessageWithDurableNonceLifetime;
        // @ts-expect-error Should not have a nonce-based lifetime
        message satisfies { lifetimeConstraint: { nonce: Nonce } };
        // @ts-expect-error Should not start with a nonce instruction.
        message.instructions[0] satisfies AdvanceNonceAccountInstruction;
        assertIsTransactionMessageWithDurableNonceLifetime(message);
        message satisfies BaseTransactionMessage & TransactionMessageWithDurableNonceLifetime & { some: 1 };
        message satisfies TransactionMessageWithDurableNonceLifetime;
        message satisfies { lifetimeConstraint: { nonce: Nonce } };
        message.instructions[0] satisfies AdvanceNonceAccountInstruction;
    }
}

// [DESCRIBE] setTransactionMessageLifetimeUsingDurableNonce
{
    // It sets the durable nonce lifetime on the transaction message for v0 messages.
    {
        const message = null as unknown as V0TransactionMessage & { some: 1 };
        const newMessage = setTransactionMessageLifetimeUsingDurableNonce(mockNonceConfig, message);
        newMessage satisfies TransactionMessageWithDurableNonceLifetime & V0TransactionMessage & { some: 1 };
        // @ts-expect-error Should not be a legacy message.
        newMessage satisfies LegacyTransactionMessage & TransactionMessageWithDurableNonceLifetime & { some: 1 };
    }

    // It sets the durable nonce lifetime on the transaction message for legacy messages.
    {
        const message = null as unknown as LegacyTransactionMessage & { some: 1 };
        const newMessage = setTransactionMessageLifetimeUsingDurableNonce(mockNonceConfig, message);
        newMessage satisfies LegacyTransactionMessage & TransactionMessageWithDurableNonceLifetime & { some: 1 };
        // @ts-expect-error Should not be a v0 message.
        newMessage satisfies TransactionMessageWithDurableNonceLifetime & V0TransactionMessage & { some: 1 };
    }

    // It prepends the nonce instruction to the transaction message.
    {
        const feePayer = null as unknown as Address;
        const message = pipe(
            createTransactionMessage({ version: 0 }),
            m => setTransactionMessageFeePayer(feePayer, m),
            m => appendTransactionMessageInstruction(null as unknown as InstructionA, m),
            m => setTransactionMessageLifetimeUsingDurableNonce(mockNonceConfig, m),
        );

        message satisfies BaseTransactionMessage & TransactionMessageWithFeePayer;
        message satisfies TransactionMessageWithDurableNonceLifetime<'nonce', 'nonceAuthority', 'nonce'>;
        message.instructions satisfies readonly [
            AdvanceNonceAccountInstruction<'nonce', 'nonceAuthority'>,
            InstructionA,
        ];
    }

    // It replaces the existing nonce instruction with the new one.
    {
        const feePayer = null as unknown as Address;
        const message = pipe(
            createTransactionMessage({ version: 0 }),
            m => setTransactionMessageFeePayer(feePayer, m),
            m => appendTransactionMessageInstruction(null as unknown as InstructionA, m),
            m => setTransactionMessageLifetimeUsingDurableNonce(mockNonceConfig, m),
            m => setTransactionMessageLifetimeUsingDurableNonce(newMockNonceConfig, m),
        );

        message satisfies BaseTransactionMessage & TransactionMessageWithFeePayer;
        message satisfies TransactionMessageWithDurableNonceLifetime<'newNonce', 'newNonceAuthority', 'newNonce'>;
        message.instructions satisfies readonly [
            AdvanceNonceAccountInstruction<'newNonce', 'newNonceAuthority'>,
            InstructionA,
        ];
    }

    // It keeps the size limit type safety if we are only updating the durable nonce lifetime.
    {
        const message = null as unknown as BaseTransactionMessage &
            TransactionMessageWithDurableNonceLifetime &
            TransactionMessageWithinSizeLimit;
        const newMessage = setTransactionMessageLifetimeUsingDurableNonce(mockNonceConfig, message);
        newMessage satisfies TransactionMessageWithinSizeLimit;
    }

    // It removes the size limit type safety if we previously has a blockhash lifetime.
    {
        const message = null as unknown as BaseTransactionMessage &
            TransactionMessageWithBlockhashLifetime &
            TransactionMessageWithinSizeLimit;
        const newMessage = setTransactionMessageLifetimeUsingDurableNonce(mockNonceConfig, message);
        // @ts-expect-error The message may no longer be within size limit.
        newMessage satisfies TransactionMessageWithinSizeLimit;
    }

    // It removes the size limit type safety if we previously had no lifetime set.
    {
        const message = null as unknown as BaseTransactionMessage & TransactionMessageWithinSizeLimit;
        const newMessage = setTransactionMessageLifetimeUsingDurableNonce(mockNonceConfig, message);
        // @ts-expect-error The message may no longer be within size limit.
        newMessage satisfies TransactionMessageWithinSizeLimit;
    }
}
