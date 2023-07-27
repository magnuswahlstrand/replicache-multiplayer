import {NextApiRequest, NextApiResponse} from "next";
import {PushRequest} from "replicache";
import {dbWithTx, DEFAULT_SPACE_ID} from "@/db";
import Pusher from "pusher";
import {processMutation} from "@/lib/mutation";

export default handlePush;

async function handlePush(req: NextApiRequest, res: NextApiResponse) {
    const push = req.body as PushRequest;

    const t0 = Date.now();
    try {
        // Iterate each mutation in the push.
        for (const mutation of push.mutations) {
            const t1 = Date.now();

            try {
                await dbWithTx(async (tx) => {
                    await processMutation(tx, push.clientID, DEFAULT_SPACE_ID, mutation)
                });

            } catch (e: unknown) {
                console.error('Caught error from mutation, ignore for now', mutation, e);
            }

            console.log('Processed mutation in', Date.now() - t1);
            await sendPoke();
        }
    } catch (e: any) {
        console.error(e);
        res.status(500).send(e.toString());
        return
    } finally {
        console.log('Processed push in', Date.now() - t0);
    }
    res.json({});
    res.end();
}

//
// async function processMutation(t: TxType, clientID: string, spaceID: string, mutation: Mutation, error?: unknown) {
//     // Get the previous version for the affected space and calculate the next
//     // one.
//
//
//     const versions = await t
//         .select({version: spaces.version})
//         .from(spaces).where(eq(spaces.key, spaceID))
//         .for('update').execute()
//
//     // TODO: handle case no version is found.
//     const prevVersion = versions[0].version;
//     const nextVersion = prevVersion + 1;
//
//     const lastMutationID = await getLastMutationID(t, clientID, false);
//     const nextMutationID = lastMutationID + 1;
//
//     console.log('nextVersion', nextVersion, 'nextMutationID', nextMutationID);
//
//     // It's common due to connectivity issues for clients to send a
//     // mutation which has already been processed. Skip these.
//     if (mutation.id < nextMutationID) {
//         console.log(`Mutation ${mutation.id} has already been processed - skipping`);
//         return;
//     }
//
//     // If the Replicache client is working correctly, this can never
//     // happen. If it does there is nothing to do but return an error to
//     // client and report a bug to Replicache.
//     if (mutation.id > nextMutationID) {
//         throw new Error(`Mutation ${mutation.id} is from the future - aborting`);
//     }
//
//     if (error === undefined) {
//         console.log('Processing mutation:', JSON.stringify(mutation));
//
//         // For each possible mutation, run the server-side logic to apply the
//         // mutation.
//         switch (mutation.name) {
//             case 'createMessage':
//                 // TODO: fix type for mutation.args
//                 await createMessage(t, mutation.args as Message, spaceID, nextVersion);
//                 break;
//             default:
//                 throw new Error(`Unknown mutation: ${mutation.name}`);
//         }
//     } else {
//         // TODO: You can store state here in the database to return to clients to
//         // provide additional info about errors.
//         console.log(
//             'Handling error from mutation',
//             JSON.stringify(mutation),
//             error,
//         );
//     }
//
//     console.log('setting', clientID, 'last_mutation_id to', nextMutationID);
//     // Update lastMutationID for requesting client.
//     await setLastMutationID(t, clientID, nextMutationID);
//
//     // Update version for space.
//     await t.update(spaces).set({version: nextVersion}).where(eq(spaces.key, spaceID)).execute()
//     // await t.none('update space set version = $1 where key = $2', [
//     //     nextVersion,
//     //     spaceID,
//     // ]);
//     await sendPoke();
// }
//
// export async function getLastMutationID(t: TxType, clientID: string, required: boolean) {
//     const clientIds = await t
//         .select()
//         .from(replicacheClients)
//         .where(eq(replicacheClients.id, clientID))
//         .execute()
//
//     switch (clientIds.length) {
//         case 0:
//             if (required) {
//                 throw new Error(`client not found: ${clientID}`);
//             }
//             return 0;
//         case 1:
//             return clientIds[0].last_mutation_id;
//         default:
//             throw new Error(`multiple clients found: ${clientID}`);
//     }
//
//     // const clientRow = await t.oneOrNone(
//     //     'select last_mutation_id from replicache_client where id = $1',
//     //     clientID,
//     // );
//     // if (!clientRow) {
//     //     // If the client is unknown ensure the request is from a new client. If it
//     //     // isn't, data has been deleted from the server, which isn't supported:
//     //     // https://github.com/rocicorp/replicache/issues/1033.
//     //     if (required) {
//     //         throw new Error(`client not found: ${clientID}`);
//     //     }
//     //     return 0;
//     // }
//     // return parseInt(clientRow.last_mutation_id);
// }
//
// async function setLastMutationID(t: TxType, clientID: string, mutationID: number) {
//     // TODO: Nicer way to do upsert
//
//
//     const result = await t.update(replicacheClients)
//         .set({last_mutation_id: mutationID}).where(eq(replicacheClients.id, clientID)).execute()
//
//     // const result = await t.result(
//     //     'update replicache_client set last_mutation_id = $2 where id = $1',
//     //     [clientID, mutationID],
//     // );
//     if (result.count === 0) {
//         await t.insert(replicacheClients).values({id: clientID, last_mutation_id: mutationID}).execute()
//         // await t.none(
//         //     'insert into replicache_client (id, last_mutation_id) values ($1, $2)',
//         //     [clientID, mutationID],
//         // );
//     }
// }


const pusher = new Pusher({
    appId: process.env.NEXT_PUBLIC_REPLICHAT_PUSHER_APP_ID ?? "",
    key: process.env.NEXT_PUBLIC_REPLICHAT_PUSHER_KEY ?? "",
    secret: process.env.NEXT_PUBLIC_REPLICHAT_PUSHER_SECRET ?? "",
    cluster: process.env.NEXT_PUBLIC_REPLICHAT_PUSHER_CLUSTER ?? "",
    useTLS: true,
});

async function sendPoke() {
    const t0 = Date.now();
    await pusher.trigger('default', 'poke', {});
    console.log('Sent poke in', Date.now() - t0);
}