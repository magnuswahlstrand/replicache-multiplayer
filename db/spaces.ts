import {TxType} from "@/types";
import {spaces} from "@/db/schema";
import {eq} from "drizzle-orm";


export async function getSpaceVersion(tx: TxType, spaceID: string) {
    const versions = await tx
        .select({version: spaces.version})
        .from(spaces).where(eq(spaces.key, spaceID))
        .for('update').execute()

    return versions[0].version;
}

export async function setSpaceVersion(tx: TxType, spaceID: string, version: number) {
    await tx.update(spaces).set({version}).where(eq(spaces.key, spaceID)).execute()
}

export async function createSpace(tx: TxType, spaceID: string) {
    await tx.insert(spaces).values({key: spaceID, version: 0}).execute()
}