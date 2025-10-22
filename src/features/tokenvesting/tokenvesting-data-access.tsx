"use client";

import {getVestingProgram, getVestingProgramId} from "../../lib/tokenvesting-anchor";
import {useSolana} from "@/components/solana/use-solana";
import {Cluster, PublicKey} from "@solana/web3.js";
import {useMutation, useQuery} from "@tanstack/react-query";
import {useMemo} from "react";
import {toast} from "sonner";
import {useCluster} from "../cluster/cluster-data-access";
import {useAnchorProvider} from "../solana/solana-provider";
import {useTransactionToast} from "../../ui/ui-layout";
import {TOKEN_PROGRAM_ID} from "@solana/spl-token";

interface CreateVestingArgs {
    companyName: string;
    mint: string;
}

interface CreateEmployeeArgs {
    startTime: number;
    endTime: number;
    totalAmount: number;
    cliffTime: number;
}

export function useVestingProgram() {
    const {client} = useSolana();
    const {cluster} = useCluster();
    const transactionToast = useTransactionToast();
    const provider = useAnchorProvider();
    const programId = useMemo(
        () => getVestingProgramId(cluster.id as Cluster),
        [cluster]
    );
    const program = getVestingProgram(provider);

    const accounts = useQuery({
        queryKey: ["vesting", "all", {cluster}],
        queryFn: async () => {
            if (!program) return [];
            try {
                return await program.account.vestingAccount.all();
            } catch (error) {
                console.error('Error fetching vesting accounts:', error);
                return [];
            }
        },
        enabled: !!program,
    });

    const getProgramAccount = useQuery({
        queryKey: ["get-program-account", {cluster}],
        queryFn: async () => {
            if (!client) return null;
            try {
                return await client.rpc.getAccountInfo(programId.toString() as Parameters<typeof client.rpc.getAccountInfo>[0]);
            } catch (error) {
                console.error('Error fetching program account:', error);
                return null;
            }
        },
        enabled: !!client,
    });

    const createVestingAccount = useMutation<string, Error, CreateVestingArgs>({
        mutationKey: ["vestingAccount", "create", {cluster}],
        mutationFn: async ({companyName, mint}) => {
            if (!program) throw new Error('Program not initialized');
            try {
                return await program.methods
                    .createVestingAccount(companyName)
                    .accounts({mint: new PublicKey(mint), tokenProgram: TOKEN_PROGRAM_ID})
                    .rpc();
            } catch (error) {
                console.error('Failed to create vesting account:', error);
                throw error;
            }
        },
        onSuccess: (signature) => {
            transactionToast(signature);
            return accounts.refetch();
        },
        onError: () => toast.error("Failed to initialize account"),
    });

    return {
        program,
        programId,
        accounts,
        getProgramAccount,
        createVestingAccount,
    };
}

export function useVestingProgramAccount({account}: {account: PublicKey}) {
    const {cluster} = useCluster();
    const transactionToast = useTransactionToast();
    const {program, accounts} = useVestingProgram();

    const accountQuery = useQuery({
        queryKey: ["vesting", "fetch", {cluster, account}],
        queryFn: async () => {
            if (!program) return null;
            try {
                return await program.account.vestingAccount.fetch(account);
            } catch (error) {
                console.error('Error fetching vesting account:', error);
                return null;
            }
        },
        enabled: !!program,
    });

    const createEmployeeVesting = useMutation<string, Error, CreateEmployeeArgs>({
        mutationKey: ["vesting", "close", {cluster, account}],
        mutationFn: async ({startTime, endTime, totalAmount, cliffTime}) => {
            if (!program) throw new Error('Program not initialized');
            try {
                return await program.methods
                    .createEmployeeVesting(startTime, endTime, totalAmount, cliffTime)
                    .rpc();
            } catch (error) {
                console.error('Failed to create employee vesting:', error);
                throw error;
            }
        },
        onSuccess: (tx) => {
            transactionToast(tx);
            return accounts.refetch();
        },
    });

    return {
        accountQuery,
        createEmployeeVesting,
    };
}