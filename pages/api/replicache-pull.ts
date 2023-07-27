import {NextApiRequest, NextApiResponse} from "next";
import {dbWithTx, DEFAULT_SPACE_ID, TxType} from "@/db";
import {PullRequest} from "replicache";
import {entities} from "@/db/schema";
import {gt} from "drizzle-orm";
import {getSpaceVersion} from "@/db/spaces";
import {getLastMutationID} from "@/lib/mutation";
import {User} from "@/types/user";

export default handlePull;

type Op = {
    op: 'clear',
} | {
    op: 'put',
    key: string,
    value: User,
} | {
    op: 'del',
    key: string,
}


async function processPull(tx: TxType, pull: PullRequest): Promise<{
    version: number,
    patch: Op[],
    lastMutationID: number,
}> {
    // Select current version
    const version = await getSpaceVersion(tx, DEFAULT_SPACE_ID)

    // Get current version for space.
    // const version = (
    //     await t.one('select version from space where key = $1', defaultSpaceID)
    // ).version;

    // Get lmid for requesting client.
    const isExistingClient = pull.lastMutationID > 0;
    const lastMutationID = await getLastMutationID(
        tx,
        pull.clientID,
        isExistingClient,
    );

    // Get changed domain objects since requested version.
    const fromVersion = pull.cookie as number ?? 0;
    const changed = await tx
        .select()
        .from(entities).where(gt(entities.version, fromVersion))
        .execute()

    // Build and return response.
    const patch: Op[] = [];
    for (const row of changed) {
        if (row.deleted) {
            if (fromVersion > 0) {
                patch.push({
                    op: 'del',
                    key: `user/${row.id}`,
                });
            }
        } else {
            patch.push({
                op: 'put',
                key: `user/${row.id}`,
                value: row.data,
            });
        }
    }
    console.log(`Sending patch`, JSON.stringify(patch));


    return {
        version,
        patch,
        lastMutationID,
    }
}

async function handlePull(req: NextApiRequest, res: NextApiResponse) {
    const pull = req.body as PullRequest;
    console.log(`Processing pull`, JSON.stringify(pull));
    const t0 = Date.now();

    try {
        // Read all data in a single transaction so it's consistent.
        const {version, patch, lastMutationID} = await dbWithTx(async (tx) => {
            return processPull(tx, pull)
        })

        res.json({
            lastMutationID,
            cookie: version,
            patch,
        });
        res.end();
    } catch (e: unknown) {
        console.error(e);
        res.status(500).send(e);
    } finally {
        console.log('Processed pull in', Date.now() - t0);
    }
}