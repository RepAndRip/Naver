import { BaseResource } from '@repandrip/core';
export declare class Tag extends BaseResource {
    private getDocument;
    private getButtonArea;
    get URL(): URL;
    get name(): string;
    get postCount(): number;
    get followers(): number;
    getPostList(sort?: 'relevant' | 'recent', page?: number): Promise<import("./post").TagPostMeta[]>;
    getMemberList(page?: number): Promise<import("./member").TagMemberMeta[]>;
    getRelatedTags(): Promise<TagMeta[]>;
}
export declare class TagMeta extends BaseResource {
    get URL(): URL;
    get name(): string;
    get(): Promise<Tag>;
}
