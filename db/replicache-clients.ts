import {TxType} from "@/db/index";
import {replicacheClients} from "@/db/schema";
import {eq} from "drizzle-orm";

export async function getLastMutationID(t: TxType, clientID: string, required: boolean) {
    const clientIds = await t
        .select()
        .from(replicacheClients)
        .where(eq(replicacheClients.id, clientID))
        .execute()

    if (clientIds.length === 0) {
        if (required) {
            throw new Error(`client not found: ${clientID}`);
        }
        return 0;
    } else {
        return clientIds[0].last_mutation_id;
    }
}

export async function setLastMutationID(t: TxType, clientID: string, mutationID: number) {
    const result = await t.update(replicacheClients)
        .set({last_mutation_id: mutationID}).where(eq(replicacheClients.id, clientID)).execute()

    if (result.count === 0) {
        await t.insert(replicacheClients).values({id: clientID, last_mutation_id: mutationID}).execute()
    }
}