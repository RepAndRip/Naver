"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostManager = void 0;
const jsdom_1 = require("jsdom");
const core_1 = require("@repandrip/core");
const post_1 = require("../resource/post");
const static_values_1 = require("../static-values");
const misc_1 = require("../resource/misc");
const cache_1 = require("../core/cache");
class PostManager extends core_1.BaseManager {
    _cachedPostList = (0, cache_1.createCacheManager)();
    _cachedPost = (0, cache_1.createCacheManager)();
    member;
    async list(page = 1) {
        const { _cachedPostList } = this;
        const cacheKey = `${page}`;
        const cached = _cachedPostList[cacheKey];
        if (cached !== undefined) {
            return cached;
        }
        const result = await (async () => {
            const data = (0, misc_1.parseJSON)(await this.request({ method: 'GET', link: static_values_1.MemberPostsListURL, query: { memberNo: `${this.member.ID}`, fromNo: `${page || 1}` }, is404Error: true }) || '');
            const list = [];
            if (!JSON.parse(data.emptyList)) {
                const dom = new jsdom_1.JSDOM(data.html);
                const { window: { document } } = dom;
                const listElement = document.getElementsByClassName('lst_feed')[0];
                for (const listPostMeta of Array.from(listElement.children)) {
                    list.push(new post_1.MemberPostMeta(this.client, this.member, listPostMeta));
                }
            }
            return list;
        })();
        return (_cachedPostList[cacheKey] = result);
    }
    async get(volumeID) {
        const { _cachedPost } = this;
        const cacheKey = `${volumeID}`;
        if (cacheKey in _cachedPost) {
            return _cachedPost[cacheKey];
        }
        const result = await (async () => {
            const data = await this.request({ method: 'GET', link: static_values_1.PostURL, query: { memberNo: `${this.member.ID}`, volumeNo: `${volumeID}` } });
            if (data && (!data.includes('alert(\'포스트가 존재하지 않습니다.\');'))) {
                return new post_1.Post(this.client, { html: data, ID: volumeID, member: this.member });
            }
        })();
        return (_cachedPost[cacheKey] = result);
    }
    constructor(client, member) {
        super(client);
        this.member = member;
    }
}
exports.PostManager = PostManager;
