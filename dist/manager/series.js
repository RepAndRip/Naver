"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeriesManager = void 0;
const core_1 = require("@repandrip/core");
const series_1 = require("../resource/series");
const post_1 = require("../resource/post");
const static_values_1 = require("../static-values");
const jsdom_1 = require("jsdom");
const misc_1 = require("../resource/misc");
const cache_1 = require("../core/cache");
class SeriesManager extends core_1.BaseManager {
    _cachedSeries = (0, cache_1.createCacheManager)();
    _cachedSeriesPosts = (0, cache_1.createCacheManager)();
    member;
    async get(seriesID) {
        const { _cachedSeries } = this;
        const cacheKey = `${seriesID}`;
        if (cacheKey in _cachedSeries) {
            return _cachedSeries[cacheKey];
        }
        const result = await (async () => {
            const data = await this.request({ link: static_values_1.SeriesURL, method: 'GET', query: { memberNo: `${this.member.ID}`, seriesNo: `${seriesID}` } });
            if (data && (!data.includes('alert(\'시리즈를 다시 확인해주세요.\');'))) {
                return new series_1.Series(this.client, this.member, { html: data, seriesID });
            }
        })();
        return (_cachedSeries[cacheKey] = result);
    }
    async getPosts(seriesID, page = 1) {
        const { _cachedSeriesPosts } = this;
        const cacheKey = `${seriesID}-${page}`;
        if (cacheKey in _cachedSeriesPosts) {
            return _cachedSeriesPosts[cacheKey];
        }
        const result = await (async () => {
            const series = await this.get(seriesID);
            if (series) {
                const data = await this.request({ link: static_values_1.SeriesPostsURL, method: 'GET', query: { memberNo: `${this.member.ID}`, totalCount: `${series.posts}`, seriesNo: `${seriesID}`, fromNo: `${page}` } });
                if (data) {
                    const { window: { document } } = new jsdom_1.JSDOM((0, misc_1.parseJSON)(data).html);
                    const seriesPostsElement = document.getElementsByClassName('list_spot_post _post_list')[0];
                    const seriesPosts = [];
                    for (const postElement of Array.from(seriesPostsElement.children || [])) {
                        seriesPosts.push(new post_1.SeriesPostMeta(this.client, series, postElement));
                    }
                    return seriesPosts;
                }
            }
        })();
        return (_cachedSeriesPosts[cacheKey] = result);
    }
    constructor(client, member) {
        super(client);
        this.member = member;
    }
}
exports.SeriesManager = SeriesManager;
