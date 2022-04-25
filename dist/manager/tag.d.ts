import { BaseManager } from '@repandrip/core';
import { Tag, TagMeta } from '../resource/tag';
import { TagPostMeta } from '../resource/post';
import { TagMemberMeta } from '../resource/member';
export declare class TagManager extends BaseManager {
    private readonly _cachedTag;
    private readonly _cachedTagPostList;
    private readonly _cachedTagMemberList;
    private readonly _cachedRelatedTagLlist;
    get(name: string): Promise<Tag>;
    getRelatedTags(name: string): Promise<TagMeta[]>;
    getPostList(name: string, sort?: 'relevant' | 'recent', page?: number): Promise<TagPostMeta[]>;
    getMemberList(name: string, page?: number): Promise<TagMemberMeta[]>;
}
