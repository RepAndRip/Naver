/// <reference types="node" />
import { BaseResource, SubClient } from '@repandrip/core';
import { URL } from 'url';
import { Image } from './misc';
import { Tag, TagMeta } from './tag';
import { Member, TagPostAuthorMeta } from '../resource/member';
import { Series, MemberPostSeriesMeta, PostSeriesMeta, TagPostSeriesMeta } from './series';
export declare class Post extends BaseResource {
    private getDocument;
    private getHead;
    private getWrap;
    private getCardElements;
    get body(): Array<PostComponent> | Array<CardComponent> | string;
    get title(): string;
    get ID(): number;
    get URL(): URL;
    get date(): Date;
    get author(): Member;
    get tags(): Array<TagMeta>;
    get series(): PostSeriesMeta;
    get banner(): Image | null;
}
export declare class PostTextComponent extends BaseResource {
    readonly post: Post;
    get type(): 'text';
    get content(): string;
    constructor(client: SubClient, post: Post, rawData?: any);
}
export declare class PostImageComponent extends BaseResource {
    readonly post: Post;
    get type(): 'image';
    get image(): Image;
    download(type?: 'full' | 'thumb', customPath?: {
        path: string;
        type: 'file' | 'dir';
    } | string): Promise<string>;
    constructor(client: SubClient, post: Post, rawData?: any);
}
export declare class PostLinkComponent extends BaseResource {
    readonly post: Post;
    get type(): 'link';
    get link(): URL;
    constructor(client: SubClient, post: Post, rawData?: any);
}
export declare type PostComponent = PostTextComponent | PostImageComponent | PostLinkComponent;
export declare class CardComponent extends BaseResource {
    readonly post: Post;
    get type(): 'card';
    get image(): Image;
    constructor(client: SubClient, post: Post, rawData?: any);
}
export declare class MemberPostMeta extends BaseResource {
    private getInfo;
    get date(): Date;
    get views(): number;
    get title(): string;
    get excerpt(): string;
    get URL(): URL;
    get ID(): number;
    get thumbnail(): Image;
    get comments(): number;
    get series(): MemberPostSeriesMeta;
    readonly author: Member;
    get(): Promise<Post>;
    constructor(client: SubClient, author: Member, rawData?: any);
}
export declare class TagPostMeta extends BaseResource {
    readonly tag: Tag;
    get ID(): number;
    get URL(): URL;
    get date(): Date;
    get views(): number;
    get title(): string;
    get excerpt(): string;
    get thumbnail(): Image;
    get author(): TagPostAuthorMeta;
    get series(): TagPostSeriesMeta;
    get(): Promise<Post>;
    constructor(client: SubClient, tag: Tag, rawData?: any);
}
export declare class SeriesPostMeta extends BaseResource {
    get thumbnail(): Image;
    get date(): Date;
    get title(): string;
    get URL(): URL;
    get ID(): number;
    readonly series: Series;
    readonly author: Member;
    get(): Promise<Post>;
    constructor(client: SubClient, series: Series, rawData?: any);
}
