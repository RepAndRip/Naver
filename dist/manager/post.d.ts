import { BaseManager, SubClient } from '@repandrip/core';
import { Member } from '../resource/member';
import { MemberPostMeta, Post } from '../resource/post';
export declare class PostManager extends BaseManager {
    private readonly _cachedPostList;
    private readonly _cachedPost;
    member: Member;
    list(page?: number): Promise<Array<MemberPostMeta>>;
    get(volumeID: number): Promise<Post | undefined>;
    constructor(client: SubClient, member: Member);
}
