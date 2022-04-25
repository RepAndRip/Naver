/// <reference types="node" />
import { BaseResource, SubClient } from '@repandrip/core';
import { URL } from 'url';
import { Tag, TagMeta } from '../resource/tag';
import { PostManager } from '../manager/post';
import { Image } from '../resource/misc';
import { SeriesManager } from '../manager/series';
export declare class Member extends BaseResource {
    private getDocument;
    private getInfo;
    get username(): string;
    get avatar(): Image;
    get followers(): number;
    get following(): number;
    get postCount(): number;
    get isVerified(): boolean;
    get ID(): number;
    get URL(): URL;
    posts: PostManager;
    series: SeriesManager;
    getProfile(): Promise<MemberProfile>;
    constructor(client: SubClient, rawData: {
        html: string;
        [key: string]: any;
    });
}
export declare class MemberProfile extends BaseResource {
    private getDocument;
    get description(): string;
    get badges(): Array<string>;
    get links(): Array<URL>;
    get tags(): Array<TagMeta>;
    readonly member: Member;
    constructor(client: SubClient, member: Member, rawData?: any);
}
export declare class TagMemberMeta extends BaseResource {
    readonly tag: Tag;
    get username(): string;
    get followers(): number;
    get avatar(): Image;
    get verified(): boolean;
    get tags(): Array<TagMeta>;
    get URL(): URL;
    get ID(): number;
    constructor(client: SubClient, tag: Tag, rawData?: any);
}
export declare class TagPostAuthorMeta extends BaseResource {
    get URL(): URL;
    get ID(): number;
    get username(): string;
    get verified(): boolean;
    get badges(): Array<string>;
    get avatar(): Image;
}
