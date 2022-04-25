"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagPostAuthorMeta = exports.TagMemberMeta = exports.MemberProfile = exports.Member = void 0;
const core_1 = require("@repandrip/core");
const jsdom_1 = require("jsdom");
const url_1 = require("url");
const tag_1 = require("../resource/tag");
const post_1 = require("../manager/post");
const static_values_1 = require("../static-values");
const misc_1 = require("../resource/misc");
const series_1 = require("../manager/series");
class Member extends core_1.BaseResource {
    getDocument() { return this._lazyGet('dom', (rawData) => new jsdom_1.JSDOM(rawData.html).window.document); }
    getInfo() {
        return this._lazyGet('infowrap', () => {
            const infoWrapElement = this.getDocument().getElementsByClassName('info_wrap')[0];
            const [folowerCountElement, followingCountElement, postCountElement] = Array.from(infoWrapElement.children);
            const parseFunc = (text) => Number.parseInt(text?.split(',').join('') || '0') || 0;
            const followers = parseFunc(folowerCountElement.getElementsByClassName('num')[0].textContent);
            const following = parseFunc(followingCountElement.getElementsByClassName('num')[0].textContent);
            const posts = parseFunc(postCountElement.getElementsByClassName('num')[0].textContent);
            return { followers, following, posts };
        });
    }
    get username() {
        return this._lazyGet('username', () => this.getDocument().getElementsByTagName('title')[0].textContent);
    }
    get avatar() {
        return this._lazyGet('avatarURL', () => new misc_1.Image(this.client, this.getDocument().getElementsByClassName('thum_wrap')[0].getElementsByTagName('img')[0].getAttribute('src')));
    }
    get followers() { return this.getInfo().followers; }
    get following() { return this.getInfo().following; }
    get postCount() { return this.getInfo().posts; }
    get isVerified() {
        return this._lazyGet('isVerified', () => !!this.getDocument().getElementsByClassName('ico_official_large')[0]);
    }
    get ID() { return this._lazyGet('memberNo', (rawData) => rawData.ID); }
    get URL() { return this._lazyGet('URL', () => `${static_values_1.MemberURL}?memberNo=${this.ID}`); }
    posts;
    series;
    getProfile() {
        return this.client.members.getProfile(this.ID);
    }
    constructor(client, rawData) {
        super(client, rawData);
        this.posts = new post_1.PostManager(client, this);
        this.series = new series_1.SeriesManager(client, this);
    }
}
exports.Member = Member;
class MemberProfile extends core_1.BaseResource {
    getDocument() {
        return this._lazyGet('document', (rawData) => new jsdom_1.JSDOM(rawData.html).window.document);
    }
    get description() {
        return this._lazyGet('description', () => {
            const descriptionElement = this.getDocument().getElementsByClassName('profile_area profile_desc')[0];
            descriptionElement.innerHTML = descriptionElement.innerHTML.split('<br>').join('\n');
            return descriptionElement.textContent?.trim();
        });
    }
    get badges() {
        return this._lazyGet('badges', () => {
            const badgesElement = this.getDocument().getElementsByClassName('badge_area')[0];
            const badges = [];
            for (const badgeElement of Array.from(badgesElement.children)) {
                badges.push(`${badgeElement.textContent}`);
            }
            return badges;
        });
    }
    get links() {
        return this._lazyGet('links', () => {
            const linksElement = this.getDocument().getElementsByClassName('profile_area profile_sns as_topline')[0];
            const links = [];
            for (const linkElement of Array.from(linksElement.children)) {
                if (linkElement.tagName.toLowerCase() === 'a') {
                    links.push(new url_1.URL(`${linkElement.getAttribute('href')}`));
                }
            }
            return links;
        });
    }
    get tags() {
        return this._lazyGet('tags', () => {
            const tagsElement = this.getDocument().getElementsByClassName('tag_area')[0];
            const links = [];
            for (const tagElement of Array.from(tagsElement.children)) {
                links.push(new tag_1.TagMeta(this.client, tagElement));
            }
            return links;
        });
    }
    member;
    constructor(client, member, rawData) {
        super(client, rawData);
        this.member = member;
    }
}
exports.MemberProfile = MemberProfile;
class TagMemberMeta extends core_1.BaseResource {
    tag;
    get username() {
        return this._lazyGet('username', (rawData) => rawData.getElementsByClassName('post_tit ell')[0].textContent?.trim());
    }
    get followers() {
        return this._lazyGet('followers', (rawData) => {
            const followerElement = rawData.getElementsByClassName('post_follower_status')[0];
            followerElement.removeChild(followerElement.children[0]);
            return Number.parseInt(followerElement.textContent || '0') || 0;
        });
    }
    get avatar() {
        return this._lazyGet('avatar', (rawData) => new misc_1.Image(this.client, rawData.getElementsByTagName('img')[0].getAttribute('src')));
    }
    get verified() {
        return this._lazyGet('verified', (rawData) => !!rawData.getElementsByClassName('ico_official_big')[0]);
    }
    get tags() {
        return this._lazyGet('tags', (rawData) => {
            const tags = [];
            for (const tagElement of Array.from(rawData.getElementsByClassName('tag_area')[0].children)) {
                tags.push(new tag_1.TagMeta(this.client, tagElement));
            }
            return tags;
        });
    }
    get URL() {
        return this._lazyGet('URL', (rawData) => new url_1.URL(`${static_values_1.BaseURL}${rawData.getElementsByTagName('a')[0].textContent}`));
    }
    get ID() {
        return this._lazyGet('ID', () => Number.parseInt(this.URL.searchParams.get('memberNo') || '0') || 0);
    }
    constructor(client, tag, rawData) {
        super(client, rawData);
        this.tag = tag;
    }
}
exports.TagMemberMeta = TagMemberMeta;
class TagPostAuthorMeta extends core_1.BaseResource {
    get URL() {
        return this._lazyGet('URL', (rawData) => new url_1.URL(`${static_values_1.BaseURL}${rawData.getElementsByClassName('link')[0].getAttribute('href')}`));
    }
    get ID() {
        return this._lazyGet('ID', () => Number.parseInt(this.URL.searchParams.get('memberNo') || '0') || 0);
    }
    get username() {
        return this._lazyGet('username', (rawData) => rawData.getElementsByClassName('ell')[0].textContent?.trim());
    }
    get verified() {
        return this._lazyGet('verified', (rawData) => !!rawData.getElementsByClassName('ico_official')[0]);
    }
    get badges() {
        return this._lazyGet('badges', (rawData) => {
            const badgesElement = rawData.getElementsByClassName('writer_badge')[0];
            const badges = [];
            for (const badge of Array.from(badgesElement?.children || [])) {
                const badgeText = badge.textContent?.trim();
                if (badgeText) {
                    badges.push(badgeText);
                }
            }
            return badges;
        });
    }
    get avatar() {
        return this._lazyGet('avatar', (rawData) => new misc_1.Image(this.client, rawData.getElementsByTagName('img')[0].getAttribute('src')));
    }
}
exports.TagPostAuthorMeta = TagPostAuthorMeta;
