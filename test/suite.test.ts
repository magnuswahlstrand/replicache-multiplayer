import {beforeEach, describe, expect, it} from 'vitest'
import {createSpace, getSpaceVersion, setSpaceVersion} from "@/db/spaces";
import {dbWithTx} from "@/db";
import {entities, replicacheClients, spaces} from "@/db/schema";
import {processMutation} from "@/lib/mutation";
import {getLastMutationID} from "@/db/replicache-clients";


const TEST_SPACE_ID = 'TEST_SPACE_ID';
const TEST_CLIENT = 'TEST_CLIENT_ID';
describe('spaces', () => {
    beforeEach(async () => {
        await dbWithTx(async tx => {
            await tx.delete(entities).execute()
            await tx.delete(spaces).execute()
            await createSpace(tx, TEST_SPACE_ID)
        })
    })


    it('create space starts at version 0', async () => {
        await dbWithTx(async tx => {
            const version = await getSpaceVersion(tx, TEST_SPACE_ID)
            expect(version).eq(0)
        })
    })

    it('update version', async () => {
        await dbWithTx(async tx => {
            await setSpaceVersion(tx, TEST_SPACE_ID, 2)
            const version = await getSpaceVersion(tx, TEST_SPACE_ID)
            expect(version).eq(2)
        })
    })
})

describe('replicache client', () => {
    beforeEach(async () => {
        await dbWithTx(async tx => {
            await tx.delete(entities).execute()
            await tx.delete(replicacheClients).execute()
        })
    })

    it('get last mutation is 0 for new clients', async () => {
        await dbWithTx(async tx => {
            const lastID = await getLastMutationID(tx, TEST_CLIENT, false)
            expect(lastID).eq(0)
        })
    })
    it('get last mutation throws a matching client id is required', async () => {
        expect(async () => await dbWithTx(async tx => {
            await getLastMutationID(tx, TEST_CLIENT, true)
        })).rejects.toThrow()
    })
})

describe('process mutation', () => {
    beforeEach(async () => {
        await dbWithTx(async tx => {
            await tx.delete(entities).execute()
            await tx.delete(spaces).execute()
            await createSpace(tx, TEST_SPACE_ID)
        })
    })

    it('add mutations bumps space version', async () => {
        await dbWithTx(async tx => {
            await processMutation(tx, TEST_CLIENT, TEST_SPACE_ID, {
                id: 1,
                name: 'updateUser',
                args: {id: '12', name: 'Magnus', icon: '🦁'},
                timestamp: 0
            })

            let version = await getSpaceVersion(tx, TEST_SPACE_ID)
            expect(version).eq(1)

            await processMutation(tx, TEST_CLIENT, TEST_SPACE_ID, {
                id: 2,
                name: 'updateUser',
                args: {id: '12', name: 'Magnus', icon: '🦁'},
                timestamp: 0
            })

            version = await getSpaceVersion(tx, TEST_SPACE_ID)
            expect(version).eq(2)
        })
    })
})