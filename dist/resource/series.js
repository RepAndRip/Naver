"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagPostSeriesMeta = exports.MemberPostSeriesMeta = exports.PostSeriesMeta = exports.Series = void 0;
const core_1 = require("@repandrip/core");
const url_1 = require("url");
const static_values_1 = require("../static-values");
const jsdom_1 = require("jsdom");
const tag_1 = require("../resource/tag");
class Series extends core_1.BaseResource {
    getDocument() {
        return this._lazyGet('document', (rawData) => new jsdom_1.JSDOM(rawData.html).window.document);
    }
    get title() {
        return this._lazyGet('title', () => this.getDocument().getElementsByClassName('tit_series')[0].textContent?.trim());
    }
    get posts() {
        return this._lazyGet('posts', () => Number.parseInt(this.getDocument().getElementsByClassName('series_follow_area')[0].children[0].children[1].textContent?.split(' ')[0].split(',').join('') || '0') || 0);
    }
    get followers() {
        return this._lazyGet('followers', () => Number.parseInt(this.getDocument().getElementsByClassName('series_follow_area')[0].children[2].children[1].textContent?.split(' ')[0].split(',').join('') || '0') || 0);
    }
    get tags() {
        return this._lazyGet('tags', () => {
            const tagsListElement = this.getDocument().getElementsByClassName('tag_area')[0];
            const tags = [];
            for (const tagElement of Array.from(tagsListElement.children || [])) {
                tags.push(new tag_1.TagMeta(this.client, tagElement));
            }
            return tags;
        });
    }
    get URL() {
        return this._lazyGet('URL', () => new url_1.URL(`${static_values_1.SeriesURL}?memberNo=${this.member.ID}&seriesNo${this.ID}`));
    }
    get ID() {
        return this._lazyGet('ID', (rawData) => rawData.seriesID);
    }
    member;
    getPosts(page) {
        return this.member.series.getPosts(this.ID, page);
    }
    constructor(client, member, rawData) {
        super(client, rawData);
        this.member = member;
    }
}
exports.Series = Series;
class PostSeriesMeta extends core_1.BaseResource {
    member;
    get title() {
        return this._lazyGet('name', (rawData) => {
            const seriesDiv = rawData.children[0];
            Array.from(seriesDiv.children).forEach((seriesChildElement) => seriesDiv.removeChild(seriesChildElement));
            return seriesDiv.textContent?.trim();
        });
    }
    get URL() {
        return this._lazyGet('URL', (rawData) => new url_1.URL(`${static_values_1.BaseURL}${rawData.href}`));
    }
    get ID() {
        return this._lazyGet('ID', () => Number.parseInt(this.URL.searchParams.get('seriesNo') || '0') || 0);
    }
    get() {
        return this.member.series.get(this.ID);
    }
    constructor(client, member, rawData) {
        super(client, rawData);
        this.member = member;
    }
}
exports.PostSeriesMeta = PostSeriesMeta;
class MemberPostSeriesMeta extends core_1.BaseResource {
    get URL() {
        return this._lazyGet('URL', (rawData) => new url_1.URL(`${static_values_1.BaseURL}${rawData.getAttribute('href')}`));
    }
    get ID() {
        return this._lazyGet('ID', () => Number.parseInt(this.URL.searchParams.get('seriesNo') || '0') || 0);
    }
    get title() {
        return this._lazyGet('title', (rawData) => {
            const seriesTitleElement = rawData.getElementsByClassName('ell')[0];
            seriesTitleElement.removeChild(seriesTitleElement.children[0]);
            return seriesTitleElement.textContent;
        });
    }
    post;
    member;
    get() {
        return this.member.posts.get(this.ID);
    }
    constructor(client, listPostMeta, rawData) {
        super(client, rawData);
        this.post = listPostMeta;
        this.member = listPostMeta.author;
    }
}
exports.MemberPostSeriesMeta = MemberPostSeriesMeta;
class TagPostSeriesMeta extends core_1.BaseResource {
    get URL() {
        return this._lazyGet('URL', (rawData) => new url_1.URL(`${static_values_1.BaseURL}${rawData.getAttribute('href')}`));
    }
    get ID() {
        return this._lazyGet('ID', () => Number.parseInt(this.URL.searchParams.get('seriesNo') || '0') || 0);
    }
    get title() {
        return this._lazyGet('title', (rawData) => {
            const seriesTitleElement = rawData.getElementsByClassName('ell')[0];
            seriesTitleElement.removeChild(seriesTitleElement.children[0]);
            return seriesTitleElement.textContent?.trim();
        });
    }
    post;
    member;
    get() {
        return this.client.getPost(this.member.ID, this.ID);
    }
    constructor(client, listPostMeta, rawData) {
        super(client, rawData);
        this.post = listPostMeta;
        this.member = listPostMeta.author;
    }
}
exports.TagPostSeriesMeta = TagPostSeriesMeta;
