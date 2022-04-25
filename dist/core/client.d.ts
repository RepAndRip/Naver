import { SubClient, Client as CoreClient } from '@repandrip/core';
import { MemberManager } from '../manager/member';
import { TagManager } from '../manager/tag';
export declare class Client extends SubClient {
    readonly members: MemberManager;
    readonly tags: TagManager;
    getMember(memberId: number): Promise<import("..").Member | undefined>;
    getTag(name: string): Promise<import("..").Tag>;
    getPost(memberId: number, volumeId: number): Promise<import("..").Post | undefined>;
    getSeries(memberId: number, seriesId: number): Promise<import("..").Series | undefined>;
    constructor(client: CoreClient);
}
