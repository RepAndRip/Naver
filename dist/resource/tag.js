"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagMeta = exports.Tag = void 0;
const core_1 = require("@repandrip/core");
const jsdom_1 = require("jsdom");
const static_values_1 = require("../static-values");
class Tag extends core_1.BaseResource {
    getDocument() {
        return this._lazyGet('document', (rawData) => new jsdom_1.JSDOM(rawData).window.document);
    }
    getButtonArea() {
        return this._lazyGet('buttonArea', () => this.getDocument().getElementsByClassName('btn_area')[0]);
    }
    get URL() {
        return this._lazyGet('link', () => new URL(`${static_values_1.TagURL}?tag=${this.name}`));
    }
    get name() {
        return this._lazyGet('name', () => this.getDocument().getElementsByClassName('title')[0].textContent?.trim().slice(1));
    }
    get postCount() {
        const [postCountElement] = Array.from(this.getButtonArea().children);
        Array.from(postCountElement.children).forEach((element) => postCountElement.removeChild(element));
        return Number.parseInt(postCountElement.textContent?.split(',').join('') || '0') || 0;
    }
    get followers() {
        const [, , followerCountElement] = Array.from(this.getButtonArea().children);
        Array.from(followerCountElement.children).forEach((element) => followerCountElement.removeChild(element));
        return Number.parseInt(followerCountElement.textContent?.split(',').join('') || '0') || 0;
    }
    async getPostList(sort, page) {
        return this.client.tags.getPostList(this.name, sort, page);
    }
    async getMemberList(page) {
        return this.client.tags.getMemberList(this.name, page);
    }
    async getRelatedTags() {
        return this.client.tags.getRelatedTags(this.name);
    }
}
exports.Tag = Tag;
class TagMeta extends core_1.BaseResource {
    get URL() {
        return this._lazyGet('link', (rawData) => new URL(`${static_values_1.BaseURL}${rawData.href}`));
    }
    get name() {
        return this._lazyGet('name', () => this.URL.searchParams.get('tag'));
    }
    get() {
        return this.client.tags.get(this.name);
    }
}
exports.TagMeta = TagMeta;
