"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberManager = void 0;
const core_1 = require("@repandrip/core");
const misc_1 = require("../resource/misc");
const member_1 = require("../resource/member");
const static_values_1 = require("../static-values");
const cache_1 = require("../core/cache");
class MemberManager extends core_1.BaseManager {
    _cachedMembers = (0, cache_1.createCacheManager)();
    _cachedMemberProfiles = (0, cache_1.createCacheManager)();
    async get(ID) {
        const { _cachedMembers } = this;
        const cacheKey = `${ID}`;
        if (cacheKey in _cachedMembers) {
            return _cachedMembers[cacheKey];
        }
        const result = await (async () => {
            const data = await this.request({ method: 'GET', link: static_values_1.MemberURL, query: { memberNo: `${ID}` } });
            if (data && (!data.includes('<strong class="msg">페이지를 찾을 수 없습니다.</strong>'))) {
                return new member_1.Member(this.client, { html: data, ID });
            }
        })();
        return (_cachedMembers[cacheKey] = result);
    }
    async getProfile(ID) {
        const { _cachedMemberProfiles } = this;
        const cacheKey = `${ID}`;
        if (cacheKey in _cachedMemberProfiles) {
            return _cachedMemberProfiles[cacheKey];
        }
        const result = await (async () => {
            const member = await this.get(ID);
            if (member) {
                const data = (0, misc_1.parseJSON)(await this.request({ method: 'GET', link: static_values_1.MemberProfileURL, query: { memberNo: `${ID}` } }) || '');
                if (data) {
                    return new member_1.MemberProfile(this.client, member, { html: data.html, ID });
                }
            }
        })();
        return (_cachedMemberProfiles[cacheKey] = result);
    }
}
exports.MemberManager = MemberManager;
