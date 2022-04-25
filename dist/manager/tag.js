"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagManager = void 0;
const core_1 = require("@repandrip/core");
const misc_1 = require("../resource/misc");
const tag_1 = require("../resource/tag");
const static_values_1 = require("../static-values");
const post_1 = require("../resource/post");
const member_1 = require("../resource/member");
const jsdom_1 = require("jsdom");
const cache_1 = require("../core/cache");
class TagManager extends core_1.BaseManager {
    _cachedTag = (0, cache_1.createCacheManager)();
    _cachedTagPostList = (0, cache_1.createCacheManager)();
    _cachedTagMemberList = (0, cache_1.createCacheManager)();
    _cachedRelatedTagLlist = (0, cache_1.createCacheManager)();
    async get(name) {
        const { _cachedTag } = this;
        const cacheKey = `${name}`;
        if (cacheKey in _cachedTag) {
            return _cachedTag[name];
        }
        return (_cachedTag[cacheKey] = new tag_1.Tag(this.client, await this.request({ link: static_values_1.TagURL, method: 'GET', query: { tag: name }, is404Error: true })));
    }
    async getRelatedTags(name) {
        const { _cachedRelatedTagLlist } = this;
        const cacheKey = `${name}`;
        if (cacheKey in _cachedRelatedTagLlist) {
            return _cachedRelatedTagLlist[cacheKey];
        }
        const result = await (async () => {
            const data = await this.request({ link: static_values_1.TagRelatedURL, method: 'GET', query: { tag: `${name}` }, is404Error: true });
            const tags = [];
            const { window: { document } } = new jsdom_1.JSDOM(data);
            const relatedTagsElement = document.getElementsByClassName('tag_area')[0];
            for (const tagElement of Array.from(relatedTagsElement.children)) {
                tags.push(new tag_1.TagMeta(this.client, tagElement));
            }
            return tags;
        })();
        return (_cachedRelatedTagLlist[cacheKey] = result);
    }
    async getPostList(name, sort = 'relevant', page = 1) {
        const { _cachedTagPostList } = this;
        const cacheKey = `${name}-${page}`;
        if (cacheKey in _cachedTagPostList) {
            return _cachedTagPostList[cacheKey];
        }
        const result = await (async () => {
            const tag = await this.get(name);
            const data = (0, misc_1.parseJSON)(await this.request({ link: static_values_1.TagPostsURL, method: 'GET', query: { tag: name, sortType: `${sort === 'recent' ? 'createDate' : 'rel'}.dsc`, fromNo: `${page}` }, is404Error: true }) || '');
            const list = [];
            const dom = new jsdom_1.JSDOM(data.html);
            const { window: { document } } = dom;
            const listElement = document.getElementsByClassName('lst_feed lst_feed_tag')[0];
            for (const tagPostMeta of Array.from(listElement?.children || [])) {
                list.push(new post_1.TagPostMeta(this.client, tag, tagPostMeta));
            }
            return list;
        })();
        return (_cachedTagPostList[cacheKey] = result);
    }
    async getMemberList(name, page = 1) {
        const { _cachedTagMemberList } = this;
        const cacheKey = `${name}-${page}`;
        if (cacheKey in _cachedTagMemberList) {
            return _cachedTagMemberList[cacheKey];
        }
        const result = await (async () => {
            const tag = await this.get(name);
            const list = [];
            try {
                const data = await this.request({ link: static_values_1.TagAuthorList, method: 'GET', query: { tag: name, fromNo: `${page}` }, is404Error: true }) || '';
                const dom = new jsdom_1.JSDOM(data);
                const { window: { document } } = dom;
                const listElement = document.getElementsByClassName('flick-container')[0];
                for (const tagMemberMeta of Array.from(listElement.getElementsByClassName('user_info_item'))) {
                    list.push(new member_1.TagMemberMeta(this.client, tag, tagMemberMeta));
                }
            }
            catch (error) {
            }
            return list;
        })();
        return (_cachedTagMemberList[cacheKey] = result);
    }
}
exports.TagManager = TagManager;
