import {TxType} from "@/db";
import {Mutation} from "replicache";
import {getSpaceVersion, setSpaceVersion} from "@/db/spaces";
import {setLastMutationID} from "@/db/replicache-clients";
import {entities, replicacheClients} from "@/db/schema";
import {User, userValidation} from "@/types/user";
import {eq} from "drizzle-orm";


async function updateUser(tx: TxType, user: User, spaceID: string, nextVersion: number) {
    await tx.insert(entities)
        .values({
                id: user.id,
                type: 'user',
                space_id: spaceID,
                data: user,
                deleted: false,
                version: nextVersion,
            }
        )
        .onConflictDoUpdate({
                target: entities.id,
                set: {
                    data: user,
                    version: nextVersion,
                }
            }
        );
}

export async function processMutation(tx: TxType, clientID: string, spaceID: string, mutation: Mutation) {
    const prevVersion = await getSpaceVersion(tx, spaceID)
    const nextVersion = prevVersion + 1;

    const lastMutationID = await getLastMutationID(tx, clientID, false);
    const nextMutationID = lastMutationID + 1;

    // It's common due to connectivity issues for clients to send a
    // mutation which has already been processed. Skip these.
    if (mutation.id < nextMutationID) {
        console.log(`Mutation ${mutation.id} has already been processed - skipping`);
        return;
    }

    // If the Replicache client is working correctly, this can never
    // happen. If it does there is nothing to do but return an error to
    // client and report a bug to Replicache.
    if (mutation.id > nextMutationID) {
        throw new Error(`Mutation ${mutation.id} is from the future - aborting`);
    }

    switch (mutation.name) {
        case 'updateUser':
            // Use zod to validate the mutation arguments.
            const user = userValidation.parse(mutation.args)
            await updateUser(tx, user, spaceID, nextVersion);
            break;
        default:
            throw new Error(`Unknown mutation: ${mutation.name}`);
    }

    await setLastMutationID(tx, clientID, nextMutationID);
    await setSpaceVersion(tx, spaceID, nextVersion)

    // await sendPoke();
}

// TODO: Clean up
export async function getLastMutationID(t: TxType, clientID: string, required: boolean) {
    const clientIds = await t
        .select()
        .from(replicacheClients)
        .where(eq(replicacheClients.id, clientID))
        .execute()

    switch (clientIds.length) {
        case 0:
            if (required) {
                throw new Error(`client not found: ${clientID}`);
            }
            return 0;
        case 1:
            return clientIds[0].last_mutation_id;
        default:
            throw new Error(`multiple clients found: ${clientID}`);
    }

    // const clientRow = await t.oneOrNone(
    //     'select last_mutation_id from replicache_client where id = $1',
    //     clientID,
    // );
    // if (!clientRow) {
    //     // If the client is unknown ensure the request is from a new client. If it
    //     // isn't, data has been deleted from the server, which isn't supported:
    //     // https://github.com/rocicorp/replicache/issues/1033.
    //     if (required) {
    //         throw new Error(`client not found: ${clientID}`);
    //     }
    //     return 0;
    // }
    // return parseInt(clientRow.last_mutation_id);
}