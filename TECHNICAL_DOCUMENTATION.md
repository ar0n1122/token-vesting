# Token Vesting Program - Technical Documentation

## Table of Contents

1. [Overview](#overview)
2. [Program Architecture](#program-architecture)
3. [Account Structures](#account-structures)
4. [Instructions](#instructions)
5. [Security Model](#security-model)
6. [Program Derived Addresses (PDAs)](#program-derived-addresses-pdas)
7. [Data Layout](#data-layout)
8. [Implementation Details](#implementation-details)
9. [Usage Examples](#usage-examples)
10. [Limitations and Future Extensions](#limitations-and-future-extensions)

## Overview

### Program Purpose

The Token Vesting Program is a Solana smart contract designed to establish the foundational infrastructure for token vesting mechanisms. Token vesting is a financial instrument that controls the release of tokens over time, commonly used in:

- **Employee Compensation**: Gradual release of equity tokens to align long-term incentives
- **Investor Relations**: Preventing immediate token dumping after funding rounds
- **Founder/Team Allocations**: Ensuring commitment through time-locked token releases
- **Community Rewards**: Structured distribution of governance or utility tokens

### Current Implementation Scope

This implementation provides the **infrastructure and employee onboarding layer** for a token vesting system. It establishes the necessary account structures, company vesting setups, and individual employee vesting schedules. The current version includes:

- **Company vesting account creation** with treasury setup
- **Individual employee vesting schedule creation** with time-based parameters
- **Account relationship management** between companies and employees
- **Security framework** with proper access controls and PDA management

The system does not yet implement the temporal mechanics of token release (claiming functionality).

### Program Identifier

```
Program ID: Count3AcZucFDPSFBAeHkQ6AvttieKUkyJ8HiQGhQwe
```

## Program Architecture

### Framework and Dependencies

- **Framework**: Anchor v0.30.x
- **Language**: Rust
- **Target**: Solana Runtime
- **Token Standard**: SPL Token Program

### Module Structure

```rust
#[program]
pub mod tokenvesting {
    // Program instruction handlers
}
```

The program follows Anchor's declarative programming model, utilizing:

- Attribute macros for account validation
- Automatic serialization/deserialization
- Built-in security checks
- Program Derived Address (PDA) generation

## Account Structures

### Primary Accounts

#### 1. VestingAccount

The core data structure that maintains vesting configuration state.

```rust
#[account]
#[derive(InitSpace, Debug)]
pub struct VestingAccount {
    pub owner: Pubkey,                    // 32 bytes
    pub mint: Pubkey,                     // 32 bytes
    pub treasury_token_account: Pubkey,   // 32 bytes
    #[max_len(50)]
    pub company_name: String,             // 4 + 50 bytes (length prefix)
    pub treasury_bump: u8,                // 1 byte
    pub bump: u8,                         // 1 byte
}
// Total: 152 bytes + 8 bytes discriminator = 160 bytes
```

**Field Descriptions:**

- `owner`: The authority responsible for managing this vesting arrangement
- `mint`: The SPL token mint that will be vested
- `treasury_token_account`: The token account holding the vestable tokens
- `company_name`: Human-readable identifier (maximum 50 characters)
- `treasury_bump`: PDA bump seed for the treasury account
- `bump`: PDA bump seed for this vesting account

#### 2. EmployeeAccount

Individual employee vesting schedule data structure.

```rust
#[account]
#[derive(InitSpace, Debug)]
pub struct EmployeeAccount {
    pub beneficiary: Pubkey,        // 32 bytes - Employee's wallet address
    pub start_time: i64,           // 8 bytes - Vesting start timestamp
    pub end_time: i64,             // 8 bytes - Vesting end timestamp
    pub total_amount: i64,         // 8 bytes - Total tokens to vest
    pub total_withdrawn: i64,      // 8 bytes - Tokens already claimed
    pub cliff_time: i64,           // 8 bytes - First claim allowed timestamp
    pub vesting_account: Pubkey,   // 32 bytes - Reference to company vesting
    pub bump: u8,                  // 1 byte - PDA bump seed
}
// Total: 105 bytes + 8 bytes discriminator = 113 bytes
```

**Field Descriptions:**

- `beneficiary`: The employee's wallet address who will receive tokens
- `start_time`: Unix timestamp when vesting begins (e.g., hire date)
- `end_time`: Unix timestamp when vesting fully completes (e.g., 4 years later)
- `total_amount`: Total number of tokens allocated to this employee
- `total_withdrawn`: Running count of tokens already claimed by employee
- `cliff_time`: Unix timestamp of first allowed claim (prevents immediate claiming)
- `vesting_account`: Reference to the company's main vesting account
- `bump`: PDA bump seed for security and signing capabilities

### Account Constraints and Validation

#### CreateVestingAccount Context

```rust
#[derive(Accounts)]
#[instruction(company_name: String)]
pub struct CreateVestingAccount<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        space = 8 + VestingAccount::INIT_SPACE,
        payer = signer,
        seeds = [company_name.as_ref()],
        bump
    )]
    pub vesting_account: Account<'info, VestingAccount>,

    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        init,
        token::mint = mint,
        token::authority = treasury_token_account,
        payer = signer,
        seeds = [b"vesting_treasury", company_name.as_bytes()],
        bump
    )]
    pub treasury_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}
```

**Constraint Analysis:**

1. **Signer Account**
   - `mut`: Account can be modified (for rent payment)
   - Must provide valid signature for transaction

2. **Vesting Account**
   - `init`: Creates new account (fails if already exists)
   - `space`: Allocates exactly 160 bytes of storage
   - `payer = signer`: Transaction signer pays account creation rent
   - `seeds = [company_name.as_ref()]`: Deterministic address generation
   - `bump`: Ensures address falls off the ed25519 curve

3. **Mint Account**
   - Read-only reference to existing SPL token mint
   - Validates token type for vesting operations

4. **Treasury Token Account**
   - `init`: Creates new SPL token account
   - `token::mint = mint`: Must hold tokens of specified mint
   - `token::authority = treasury_token_account`: Self-custodial authority
   - `seeds = [b"vesting_treasury", company_name.as_bytes()]`: Deterministic treasury address

#### CreateEmployeeAccount Context

```rust
#[derive(Accounts)]
pub struct CreateEmployeeAccount<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    pub beneficiary: SystemAccount<'info>,
    #[account(has_one = owner)]
    pub vesting_account: Account<'info, VestingAccount>,
    #[account(
        init,
        space = 8 + EmployeeAccount::INIT_SPACE,
        payer = owner,
        seeds = [b"employee_vesting", beneficiary.key().as_ref(), vesting_account.key().as_ref()],
        bump
    )]
    pub employee_account: Account<'info, EmployeeAccount>,
    pub system_program: Program<'info, System>,
}
```

**Constraint Analysis:**

1. **Owner Account**
   - `mut`: Account can be modified (for rent payment)
   - Must be the company owner who creates employee vesting schedules
   - Must provide valid signature for transaction

2. **Beneficiary Account**
   - `SystemAccount`: Any valid Solana wallet address
   - The employee who will receive the vested tokens
   - Does not need to sign the transaction

3. **Vesting Account**
   - `has_one = owner`: Security constraint ensuring only company owner can create schedules
   - References the company's main vesting configuration
   - Must be an existing, valid vesting account

4. **Employee Account**
   - `init`: Creates new employee vesting schedule account
   - `space`: Allocates exactly 113 bytes of storage
   - `payer = owner`: Company owner pays account creation rent
   - `seeds = [b"employee_vesting", beneficiary.key().as_ref(), vesting_account.key().as_ref()]`: Complex PDA generation
   - `bump`: Ensures address falls off the ed25519 curve

**Advanced PDA Design for Employee Accounts:**
The employee account uses a three-part seed structure:

- `b"employee_vesting"`: Namespace identifier
- `beneficiary.key().as_ref()`: Employee's wallet address
- `vesting_account.key().as_ref()`: Company's vesting account address

This design ensures:

- **Uniqueness**: Each employee-company pair gets a unique account
- **Flexibility**: Same employee can have vesting from multiple companies
- **Scalability**: Same company can have unlimited employees
- **Security**: Deterministic addresses prevent spoofing

## Instructions

### create_vesting_account

**Function Signature:**

```rust
pub fn create_vesting_account(
    ctx: Context<CreateVestingAccount>,
    company_name: String,
) -> Result<()>
```

**Purpose:** Initializes a new vesting arrangement for a specified organization.

**Parameters:**

- `ctx`: Anchor context containing validated accounts
- `company_name`: String identifier for the vesting arrangement (max 50 chars)

**Execution Flow:**

1. Validates all account constraints via Anchor
2. Initializes `VestingAccount` with provided data
3. Stores account relationships and PDA bumps
4. Returns success result

**State Changes:**

- Creates new `VestingAccount` with company-specific PDA
- Creates new treasury token account for holding vestable tokens
- Establishes ownership and authority relationships

### create_employee_vesting

**Function Signature:**

```rust
pub fn create_employee_vesting(
    ctx: Context<CreateEmployeeAccount>,
    start_time: i64,
    end_time: i64,
    total_amount: i64,
    cliff_time: i64,
) -> Result<()>
```

**Purpose:** Creates an individual vesting schedule for an employee within a company's vesting program.

**Parameters:**

- `ctx`: Anchor context containing validated accounts
- `start_time`: Unix timestamp when vesting begins (e.g., hire date)
- `end_time`: Unix timestamp when vesting fully completes (e.g., 4 years later)
- `total_amount`: Total number of tokens allocated to this employee
- `cliff_time`: Unix timestamp of first allowed claim (cliff period)

**Execution Flow:**

1. Validates company ownership via `has_one = owner` constraint
2. Validates all account constraints and PDA generation
3. Initializes `EmployeeAccount` with vesting schedule parameters
4. Sets `total_withdrawn` to 0 (no tokens claimed yet)
5. Stores canonical PDA bump for future operations
6. Links employee account to company vesting account

**State Changes:**

- Creates new `EmployeeAccount` with employee-company specific PDA
- Establishes vesting timeline and token allocation
- Links employee to company's vesting program
- Enables future token claiming operations

**Security Features:**

- Only company owner can create employee schedules
- Deterministic PDA prevents account spoofing
- Canonical bump storage prevents bump grinding attacks
- Immutable vesting parameters once created

**Real-World Example:**

```rust
// Creating vesting for Alice at Acme Corp
// Hired Jan 1, 2024, 4-year vesting, 1-year cliff, 10,000 tokens
create_employee_vesting(
    ctx,
    1704067200,    // Jan 1, 2024 (start_time)
    1830384000,    // Jan 1, 2028 (end_time)
    10000,         // 10,000 tokens (total_amount)
    1735689600     // Jan 1, 2025 (cliff_time)
)
```

## Security Model

### Access Control

- **Owner Authority**: Only the account owner can manage vesting arrangements
- **PDA Security**: Deterministic addresses prevent address spoofing
- **Account Validation**: Anchor enforces all account constraints at runtime

### Rent Exemption

- All created accounts are rent-exempt through sufficient SOL deposits
- Signer pays rent for both vesting account and treasury account

### Data Integrity

- Immutable references prevent unauthorized modifications
- Type-safe account structures prevent data corruption
- Automatic serialization ensures consistent data format

## Program Derived Addresses (PDAs)

### Vesting Account PDA

```
seeds = [company_name.as_ref()]
canonical_bump = find_program_address(seeds, program_id).1
```

**Properties:**

- **Deterministic**: Same company name always generates same address
- **Unique**: Different company names generate different addresses
- **Secure**: Only this program can sign for these addresses

### Treasury Account PDA

```
seeds = [b"vesting_treasury", company_name.as_bytes()]
canonical_bump = find_program_address(seeds, program_id).1
```

**Properties:**

- **Namespace Separation**: "vesting_treasury" prefix prevents collisions
- **Company Binding**: Tied to specific company name
- **Program Authority**: Only program can control treasury funds

### Employee Account PDA

```
seeds = [b"employee_vesting", beneficiary.key().as_ref(), vesting_account.key().as_ref()]
canonical_bump = find_program_address(seeds, program_id).1
```

**Properties:**

- **Multi-Dimensional Uniqueness**: Combines employee wallet + company vesting account
- **Namespace Separation**: "employee_vesting" prefix prevents collisions
- **Relationship Binding**: Explicitly links employee to specific company
- **Scalable Design**: Supports multiple employees per company and multiple companies per employee

**Advanced PDA Relationships:**

```
Company "Acme Corp" → VestingAccount PDA
                   ↓
                   Treasury PDA (holds tokens)
                   ↓
Employee Alice → EmployeeAccount PDA (linked to Acme Corp)
Employee Bob   → EmployeeAccount PDA (linked to Acme Corp)

Employee Alice → EmployeeAccount PDA (linked to XYZ Corp) // Alice can work for multiple companies
```

## Data Layout

### Memory Layout

#### VestingAccount Layout

```
VestingAccount {
    discriminator: [u8; 8],           // Anchor account type identifier
    owner: [u8; 32],                  // Pubkey bytes
    mint: [u8; 32],                   // Pubkey bytes
    treasury_token_account: [u8; 32], // Pubkey bytes
    company_name_len: u32,            // String length
    company_name: [u8; company_name_len], // UTF-8 string bytes (max 50)
    treasury_bump: u8,                // PDA bump seed
    bump: u8,                         // PDA bump seed
}
```

#### EmployeeAccount Layout

```
EmployeeAccount {
    discriminator: [u8; 8],           // Anchor account type identifier
    beneficiary: [u8; 32],            // Employee wallet pubkey bytes
    start_time: [u8; 8],              // i64 timestamp in little-endian
    end_time: [u8; 8],                // i64 timestamp in little-endian
    total_amount: [u8; 8],            // i64 token amount in little-endian
    total_withdrawn: [u8; 8],         // i64 claimed tokens in little-endian
    cliff_time: [u8; 8],              // i64 timestamp in little-endian
    vesting_account: [u8; 32],        // Company vesting account pubkey bytes
    bump: u8,                         // PDA bump seed
}
```

### Storage Optimization

- Fixed-size allocations prevent reallocation costs
- Compact field ordering minimizes padding
- Maximum string length prevents unbounded growth

## Implementation Details

### Error Handling

The program uses Anchor's `Result<()>` pattern for error propagation. The system includes custom error types for specific validation scenarios:

```rust
#[error_code]
pub enum ErrorCode {
    #[msg("Claiming is not available yet.")]
    ClaimNotAvailableYet,
    #[msg("There is nothing to claim.")]
    NothingToClaim,
}
```

**Common Error Scenarios:**

**VestingAccount Creation:**

- **Account Already Exists**: Attempting to create duplicate vesting account for same company name
- **Invalid Company Name**: Exceeding 50-character limit or empty string
- **Insufficient Funds**: Signer lacks SOL for rent payments
- **Invalid Mint**: Non-existent or invalid token mint
- **Authority Mismatch**: Incorrect token program or system program references

**EmployeeAccount Creation:**

- **Unauthorized Access**: Non-owner attempting to create employee schedules
- **Invalid Time Parameters**: start_time >= end_time or cliff_time < start_time
- **Duplicate Employee**: Attempting to create schedule for existing employee-company pair
- **Invalid Beneficiary**: Malformed or invalid beneficiary public key
- **Reference Errors**: Invalid or non-existent vesting account reference

**Future Error Handling (for claiming functionality):**

- **ClaimNotAvailableYet**: Employee attempts to claim before cliff period ends
- **NothingToClaim**: Employee has already claimed all available tokens
- **Insufficient Treasury**: Treasury lacks sufficient tokens for claim

### Gas Optimization

- Minimal computation in instruction handlers
- Efficient PDA generation using canonical bumps
- Pre-validated account constraints reduce runtime checks

### Cross-Program Invocations (CPIs)

The program interacts with:

- **System Program**: For account creation and rent transfers
- **Token Program**: For treasury token account initialization

## Usage Examples

### Complete Vesting Setup Workflow

#### Step 1: Company Vesting Account Creation

```typescript
// Client-side example using Anchor TypeScript
import { Program, AnchorProvider } from '@project-serum/anchor'

const program = new Program(idl, programId, provider)

// Create vesting arrangement for "Acme Corp"
const companyName = 'Acme Corp'
const [vestingAccount] = PublicKey.findProgramAddressSync([Buffer.from(companyName)], program.programId)

const [treasuryAccount] = PublicKey.findProgramAddressSync(
  [Buffer.from('vesting_treasury'), Buffer.from(companyName)],
  program.programId,
)

await program.methods
  .createVestingAccount(companyName)
  .accounts({
    signer: wallet.publicKey,
    vestingAccount,
    mint: tokenMint,
    treasuryTokenAccount: treasuryAccount,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .rpc()
```

#### Step 2: Employee Vesting Schedule Creation

```typescript
// Create vesting schedule for Alice
const aliceWallet = new PublicKey("Alice's wallet address")

// Calculate employee account PDA
const [employeeAccount] = PublicKey.findProgramAddressSync(
  [Buffer.from('employee_vesting'), aliceWallet.toBuffer(), vestingAccount.toBuffer()],
  program.programId,
)

// Vesting parameters: 4 years total, 1 year cliff, 10,000 tokens
const startTime = new Date('2024-01-01').getTime() / 1000 // Unix timestamp
const endTime = new Date('2028-01-01').getTime() / 1000 // 4 years later
const cliffTime = new Date('2025-01-01').getTime() / 1000 // 1 year cliff
const totalAmount = 10000

await program.methods
  .createEmployeeVesting(
    new anchor.BN(startTime),
    new anchor.BN(endTime),
    new anchor.BN(totalAmount),
    new anchor.BN(cliffTime),
  )
  .accounts({
    owner: wallet.publicKey, // Company owner
    beneficiary: aliceWallet, // Employee
    vestingAccount: vestingAccount, // Company vesting account
    employeeAccount: employeeAccount, // New employee account
    systemProgram: SystemProgram.programId,
  })
  .rpc()
```

#### Step 3: Multiple Employee Setup

```typescript
// Helper function for creating employee vesting
async function createEmployeeVesting(
  beneficiary: PublicKey,
  vestingParams: {
    startTime: number
    endTime: number
    totalAmount: number
    cliffTime: number
  },
) {
  const [employeeAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from('employee_vesting'), beneficiary.toBuffer(), vestingAccount.toBuffer()],
    program.programId,
  )

  return await program.methods
    .createEmployeeVesting(
      new anchor.BN(vestingParams.startTime),
      new anchor.BN(vestingParams.endTime),
      new anchor.BN(vestingParams.totalAmount),
      new anchor.BN(vestingParams.cliffTime),
    )
    .accounts({
      owner: wallet.publicKey,
      beneficiary,
      vestingAccount,
      employeeAccount,
      systemProgram: SystemProgram.programId,
    })
    .rpc()
}

// Create vesting for multiple employees
const employees = [
  {
    wallet: aliceWallet,
    tokens: 10000,
    cliffMonths: 12,
    vestingMonths: 48,
  },
  {
    wallet: bobWallet,
    tokens: 15000,
    cliffMonths: 6,
    vestingMonths: 36,
  },
]

for (const employee of employees) {
  const baseTime = new Date('2024-01-01').getTime() / 1000
  const params = {
    startTime: baseTime,
    endTime: baseTime + employee.vestingMonths * 30 * 24 * 60 * 60, // Approximate months to seconds
    totalAmount: employee.tokens,
    cliffTime: baseTime + employee.cliffMonths * 30 * 24 * 60 * 60,
  }

  await createEmployeeVesting(employee.wallet, params)
  console.log(`Created vesting for ${employee.wallet.toString()}: ${employee.tokens} tokens`)
}
```

### Account Derivation

#### Company Account Derivation

```rust
// Rust example for company PDA derivation
let company_name = "Acme Corp";

// Derive vesting account address
let (vesting_account, vesting_bump) = Pubkey::find_program_address(
    &[company_name.as_bytes()],
    &program_id
);

// Derive treasury account address
let (treasury_account, treasury_bump) = Pubkey::find_program_address(
    &[b"vesting_treasury", company_name.as_bytes()],
    &program_id
);
```

#### Employee Account Derivation

```rust
// Rust example for employee PDA derivation
let beneficiary = Pubkey::from_str("Alice's wallet address").unwrap();
let vesting_account = Pubkey::from_str("Company vesting account").unwrap();

// Derive employee account address
let (employee_account, employee_bump) = Pubkey::find_program_address(
    &[
        b"employee_vesting",
        beneficiary.as_ref(),
        vesting_account.as_ref()
    ],
    &program_id
);
```

#### TypeScript Account Derivation

```typescript
// TypeScript helper class for PDA management
class VestingPDAManager {
  constructor(private programId: PublicKey) {}

  // Company accounts
  getVestingAccount(companyName: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync([Buffer.from(companyName)], this.programId)
  }

  getTreasuryAccount(companyName: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync([Buffer.from('vesting_treasury'), Buffer.from(companyName)], this.programId)
  }

  // Employee accounts
  getEmployeeAccount(beneficiary: PublicKey, vestingAccount: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('employee_vesting'), beneficiary.toBuffer(), vestingAccount.toBuffer()],
      this.programId,
    )
  }

  // Batch employee account derivation
  getAllEmployeeAccounts(
    employees: PublicKey[],
    vestingAccount: PublicKey,
  ): Array<{ employee: PublicKey; account: PublicKey; bump: number }> {
    return employees.map((employee) => {
      const [account, bump] = this.getEmployeeAccount(employee, vestingAccount)
      return { employee, account, bump }
    })
  }
}
```

## Limitations and Future Extensions

### Current Limitations

1. **No Token Deposits**: Cannot yet deposit tokens into treasury
2. **No Token Claiming**: No mechanism for employees to claim vested tokens
3. **No Vesting Calculation**: No time-based vesting amount calculations
4. **No Schedule Modifications**: Cannot update or revoke existing vesting schedules
5. **No Treasury Management**: No functions to manage treasury token balances
6. **Single Owner Model**: No multi-signature or delegated authority for companies
7. **No Pause Mechanism**: No emergency pause functionality
8. **No Vesting Events**: No event emission for tracking vesting milestones

### Recommended Extensions

#### 1. Token Deposit Functionality

```rust
pub fn deposit_tokens(
    ctx: Context<DepositTokens>,
    amount: u64,
) -> Result<()> {
    // Transfer tokens from company owner to treasury
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.owner_token_account.to_account_info(),
                to: ctx.accounts.treasury_token_account.to_account_info(),
                authority: ctx.accounts.owner.to_account_info(),
            }
        ),
        amount
    )?;

    // Update treasury balance tracking
    ctx.accounts.vesting_account.treasury_balance += amount;
    Ok(())
}
```

#### 2. Token Claiming Functionality

```rust
pub fn claim_vested_tokens(
    ctx: Context<ClaimVestedTokens>,
    employee_bump: u8,
) -> Result<()> {
    // Validate bump
    require_eq!(employee_bump, ctx.accounts.employee_account.bump, ErrorCode::InvalidBump);

    // Check cliff period
    let current_time = Clock::get()?.unix_timestamp;
    require!(current_time >= ctx.accounts.employee_account.cliff_time, ErrorCode::ClaimNotAvailableYet);

    // Calculate vested amount
    let vested_amount = calculate_vested_amount(
        &ctx.accounts.employee_account,
        current_time
    )?;

    let claimable = vested_amount - ctx.accounts.employee_account.total_withdrawn;
    require!(claimable > 0, ErrorCode::NothingToClaim);

    // Transfer tokens using treasury PDA authority
    let treasury_seeds = &[
        b"vesting_treasury",
        ctx.accounts.vesting_account.company_name.as_ref(),
        &[ctx.accounts.vesting_account.treasury_bump]
    ];

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.treasury_token_account.to_account_info(),
                to: ctx.accounts.beneficiary_token_account.to_account_info(),
                authority: ctx.accounts.treasury_token_account.to_account_info(),
            },
            &[treasury_seeds]
        ),
        claimable
    )?;

    // Update withdrawn amount
    ctx.accounts.employee_account.total_withdrawn += claimable;
    Ok(())
}

fn calculate_vested_amount(employee: &EmployeeAccount, current_time: i64) -> Result<i64> {
    if current_time < employee.cliff_time {
        return Ok(0);
    }

    if current_time >= employee.end_time {
        return Ok(employee.total_amount);
    }

    // Linear vesting calculation
    let vesting_duration = employee.end_time - employee.start_time;
    let elapsed = current_time - employee.start_time;
    let vested = (employee.total_amount * elapsed) / vesting_duration;

    Ok(vested)
}
```

#### 3. Vesting Schedule Management

```rust
pub fn update_employee_vesting(
    ctx: Context<UpdateEmployeeVesting>,
    new_total_amount: Option<i64>,
    new_end_time: Option<i64>,
) -> Result<()> {
    // Only allow updates that don't reduce already vested amounts
    let current_time = Clock::get()?.unix_timestamp;
    let current_vested = calculate_vested_amount(&ctx.accounts.employee_account, current_time)?;

    if let Some(new_amount) = new_total_amount {
        require!(new_amount >= current_vested, ErrorCode::CannotReduceVestedAmount);
        ctx.accounts.employee_account.total_amount = new_amount;
    }

    if let Some(new_end) = new_end_time {
        require!(new_end > current_time, ErrorCode::InvalidEndTime);
        ctx.accounts.employee_account.end_time = new_end;
    }

    Ok(())
}

pub fn revoke_vesting(
    ctx: Context<RevokeVesting>,
    employee_bump: u8,
) -> Result<()> {
    // Calculate vested amount that employee keeps
    let current_time = Clock::get()?.unix_timestamp;
    let vested_amount = calculate_vested_amount(&ctx.accounts.employee_account, current_time)?;

    // Update total amount to only vested amount (stops future vesting)
    ctx.accounts.employee_account.total_amount = vested_amount;
    ctx.accounts.employee_account.end_time = current_time;

    // Emit revocation event
    emit!(VestingRevokedEvent {
        employee: ctx.accounts.employee_account.beneficiary,
        company: ctx.accounts.vesting_account.key(),
        vested_amount,
        revoked_time: current_time,
    });

    Ok(())
}
```

#### 4. Administrative and Monitoring Functions

```rust
pub fn pause_vesting(ctx: Context<PauseVesting>) -> Result<()> {
    ctx.accounts.vesting_account.is_paused = true;
    emit!(VestingPausedEvent {
        company: ctx.accounts.vesting_account.key(),
        paused_time: Clock::get()?.unix_timestamp,
    });
    Ok(())
}

pub fn get_vesting_info(ctx: Context<GetVestingInfo>) -> Result<VestingInfo> {
    let current_time = Clock::get()?.unix_timestamp;
    let employee = &ctx.accounts.employee_account;

    let vested_amount = calculate_vested_amount(employee, current_time)?;
    let claimable_amount = vested_amount - employee.total_withdrawn;
    let remaining_amount = employee.total_amount - vested_amount;

    Ok(VestingInfo {
        vested_amount,
        claimable_amount,
        remaining_amount,
        next_vest_time: calculate_next_vest_time(employee, current_time)?,
    })
}
```

#### 5. Event Emission for Tracking

```rust
#[event]
pub struct VestingCreatedEvent {
    pub company: Pubkey,
    pub employee: Pubkey,
    pub total_amount: i64,
    pub start_time: i64,
    pub end_time: i64,
    pub cliff_time: i64,
}

#[event]
pub struct TokensClaimedEvent {
    pub employee: Pubkey,
    pub company: Pubkey,
    pub amount: i64,
    pub total_claimed: i64,
    pub claim_time: i64,
}

#[event]
pub struct VestingRevokedEvent {
    pub employee: Pubkey,
    pub company: Pubkey,
    pub vested_amount: i64,
    pub revoked_time: i64,
}
```

### Integration Considerations

#### 1. Frontend Integration

- React/TypeScript client using Anchor TypeScript bindings
- Real-time vesting progress visualization
- Employee dashboard for claiming tokens

#### 2. Backend Services

- Automated vesting calculations
- Email notifications for cliff/vesting events
- Audit logging for compliance

#### 3. Governance Integration

- DAO voting on vesting parameter changes
- Multi-signature requirements for large vesting arrangements
- Emergency pause mechanisms

### Security Enhancements

1. **Access Control Lists**: Fine-grained permission management
2. **Emergency Pause**: Circuit breaker for critical issues
3. **Upgrade Authority**: Controlled program upgrades
4. **Audit Logging**: Comprehensive event tracking

## Conclusion

This token vesting program provides a comprehensive foundation for building enterprise-grade token vesting solutions on Solana. The current implementation includes:

**✅ Completed Features:**

- **Company Infrastructure**: Complete vesting account and treasury setup
- **Employee Onboarding**: Individual vesting schedule creation with time parameters
- **Security Framework**: PDA-based access control and bump validation
- **Scalable Design**: Multi-company, multi-employee architecture
- **Account Relationships**: Proper linking between companies and employees

**🔄 Architecture Highlights:**

- **Deterministic PDAs**: Predictable address generation for all account types
- **Canonical Bump Storage**: Security against bump grinding attacks
- **Flexible Time Management**: Support for cliff periods and custom vesting schedules
- **Account Constraints**: Robust validation through Anchor's constraint system
- **Error Handling**: Custom error types for specific validation scenarios

**🚀 Ready for Extension:**
The modular design enables straightforward implementation of:

- Token claiming mechanisms with time-based calculations
- Treasury management and deposit functionality
- Administrative controls and emergency features
- Event emission for comprehensive tracking
- Multi-signature and governance integration

**💼 Production Readiness:**
With the addition of claiming functionality and treasury management, this foundation can support:

- **Startup Equity**: Employee token vesting with cliff periods
- **DAO Governance**: Community reward distribution
- **Investor Relations**: Lock-up and release schedules
- **Partnership Agreements**: Milestone-based token releases

The use of Program Derived Addresses ensures security and deterministic behavior, while Anchor's constraint system provides robust validation and error handling. The two-tier account structure (company → employees) scales efficiently and maintains clear separation of concerns, making this an ideal foundation for production token vesting platforms.
