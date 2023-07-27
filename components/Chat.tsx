"use client"

import React, {useRef} from 'react';
import {Replicache, WriteTransaction} from 'replicache';
import {useSubscribe} from 'replicache-react';
import {User} from "@/types/user";
import Pusher from "pusher-js";

const REPLICACHE_LICENSE_KEY = process.env.NEXT_PUBLIC_REPLICACHE_LICENSE_KEY ?? ""

const updateUser = async (tx: WriteTransaction, user: User) => {
    await tx.put(`user/${user.id}`, user);
    console.log('message put')
}

const fakeID = 'chat-user-id' + Math.random().toString(36).substring(7)


const rep = process.browser
    ? new Replicache({
        name: fakeID,
        licenseKey: REPLICACHE_LICENSE_KEY,
        pushURL: '/api/replicache-push',
        pullURL: '/api/replicache-pull',
        mutators: {
            updateUser: updateUser,
        }
    })
    : null;

if (rep) {
    listen();
}

const emojis = [
    '👋',
    '👍',
    '👎',
    '👌',
    '👏',
    '🙌',
    '🤝',
    '🙏',
]

export default function Chat() {

    const users = useSubscribe(
        rep,
        async tx => {
            const list = await tx.scan({prefix: 'user/'}).entries().toArray();
            return (list || []) as unknown as [string, User][];
        },
        [],
    );


    // const usernameRef = useRef<HTMLInputElement | null>(null);
    const contentRef = useRef<HTMLInputElement | null>(null);

    const onSubmit: React.FormEventHandler<HTMLFormElement> = e => {
        e.preventDefault();

        // Get random entry from list
        const v = Math.floor(Math.random() * emojis.length)
        const randomEntry = emojis[v];
        console.log(randomEntry,v )

        rep?.mutate.updateUser({
            id: fakeID,
            name: "Magnus",
            icon: randomEntry,
        });
        contentRef.current!.value = '';
    }
    console.log(users)

    return (
        <div>
            <h1>{fakeID}</h1>
            <form onSubmit={onSubmit}>
                <input ref={contentRef} required/>
                <input type="submit"/>
            </form>
            <ul>
                {users.map(([id, user]) => {
                    console.log(id, user)
                    return (
                        <li key={user.id}>
                            {user.icon}{user.name}{user.id}
                        </li>
                    )
                })}
            </ul>
            {/*<MessageList messages={messages}/>*/}
        </div>
    );
}

function MessageList({messages}: { messages: User }) {
    return messages.map(([k, v]) => {
        return (<div key={k} className="grid grid-cols-2 gap-4">
            <div className="w-18 overflow-hidden overflow-ellipsis whitespace-nowrap">
                {v.from} says:
            </div>

            <div className="w-full">
                {v.content}
            </div>
        </div>)
    });
}

function listen() {
    // setTimeout(() => {
    //     rep?.pull();
    //     listen();
    // }, 2000);
    console.log('listening');
    // Listen for pokes, and pull whenever we get one.
    Pusher.logToConsole = true;
    const pusher = new Pusher(process.env.NEXT_PUBLIC_REPLICHAT_PUSHER_KEY ?? "", {
        cluster: process.env.NEXT_PUBLIC_REPLICHAT_PUSHER_CLUSTER ?? "",
    });
    const channel = pusher.subscribe('default');
    channel.bind('poke', () => {
        console.log('got poked');
        rep?.pull();
    });
}

