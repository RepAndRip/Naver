/// <reference types="node" />
import { BaseResource, SubClient } from '@repandrip/core';
import { Member } from './member';
import { URL } from 'url';
import { TagMeta } from '../resource/tag';
import { MemberPostMeta, Post, SeriesPostMeta, TagPostMeta } from '../resource/post';
import { TagPostAuthorMeta } from '../resource/member';
export declare class Series extends BaseResource {
    private getDocument;
    get title(): string;
    get posts(): number;
    get followers(): number;
    get tags(): Array<TagMeta>;
    get URL(): URL;
    get ID(): number;
    readonly member: Member;
    getPosts(page?: number): Promise<SeriesPostMeta[]>;
    constructor(client: SubClient, member: Member, rawData?: any);
}
export declare class PostSeriesMeta extends BaseResource {
    readonly member: Member;
    get title(): string;
    get URL(): URL;
    get ID(): number;
    get(): Promise<Series>;
    constructor(client: SubClient, member: Member, rawData?: any);
}
export declare class MemberPostSeriesMeta extends BaseResource {
    get URL(): URL;
    get ID(): number;
    get title(): string;
    readonly post: MemberPostMeta;
    readonly member: Member;
    get(): Promise<Post>;
    constructor(client: SubClient, listPostMeta: MemberPostMeta, rawData?: any);
}
export declare class TagPostSeriesMeta extends BaseResource {
    get URL(): URL;
    get ID(): number;
    get title(): string;
    readonly post: TagPostMeta;
    readonly member: TagPostAuthorMeta;
    get(): Promise<Post>;
    constructor(client: SubClient, listPostMeta: TagPostMeta, rawData?: any);
}
