import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { PublicKey, Cluster } from '@solana/web3.js'
import TokenvestingIDL from '../../anchor/target/idl/tokenvesting.json'
import { Tokenvesting } from '../../anchor/target/types/tokenvesting'

// Program ID - should match the one in Anchor.toml
export const TOKENVESTING_PROGRAM_ID = new PublicKey('Count3AcZucFDPSFBAeHkQ6AvttieKUkyJ8HiQGhQwe')

export function getVestingProgramId(_cluster?: Cluster): PublicKey {
  return TOKENVESTING_PROGRAM_ID
}

export function getVestingProgram(provider: AnchorProvider | null): Program<Tokenvesting> | null {
  if (!provider) return null

  return new Program(TokenvestingIDL as Program<Tokenvesting>['idl'], provider)
}
