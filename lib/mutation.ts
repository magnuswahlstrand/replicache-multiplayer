import {TxType} from "@/db";
import {Mutation} from "replicache";
import {getSpaceVersion, setSpaceVersion} from "@/db/spaces";
import {getLastMutationID} from "@/pages/api/replicache-push";
import {Message} from "@/types";
import {setLastMutationID} from "@/db/replicache-clients";

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
        case 'createMessage':
            // TODO: fix type for mutation.args
            // await createMessage(t, mutation.args as Message, spaceID, nextVersion);
            break;
        default:
            throw new Error(`Unknown mutation: ${mutation.name}`);
    }

    await setLastMutationID(tx, clientID, nextMutationID);
    await setSpaceVersion(tx, spaceID, nextVersion)

    // await sendPoke();
}