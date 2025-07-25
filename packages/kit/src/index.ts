/**
 * This is the JavaScript SDK for building Solana apps for Node, web, and React Native.
 *
 * In addition to re-exporting functions from packages in the `@solana/*` namespace, this package
 * offers additional helpers for building Solana applications, with sensible defaults.
 *
 * @packageDocumentation
 */
export * from '@solana/accounts';
export * from '@solana/addresses';
export * from '@solana/codecs';
export * from '@solana/errors';
export * from '@solana/functional';
export * from '@solana/instructions';
export * from '@solana/keys';
export * from '@solana/programs';
export * from '@solana/rpc';
export * from '@solana/rpc-parsed-types';
export * from '@solana/rpc-subscriptions';
export * from '@solana/rpc-types';
export * from '@solana/signers';
export * from '@solana/transaction-messages';
export * from '@solana/transactions';
export * from './airdrop';
export * from './decompile-transaction-message-fetching-lookup-tables';
export * from './fetch-lookup-tables';
export * from './send-and-confirm-durable-nonce-transaction';
export * from './send-and-confirm-transaction';
export * from './send-transaction-without-confirming';

export type {
    RpcRequest,
    RpcRequestTransformer,
    RpcResponse,
    RpcResponseData,
    RpcResponseTransformer,
} from '@solana/rpc-spec-types';
export { createRpcMessage } from '@solana/rpc-spec-types';
