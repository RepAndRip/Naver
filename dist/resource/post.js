"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeriesPostMeta = exports.TagPostMeta = exports.MemberPostMeta = exports.CardComponent = exports.PostLinkComponent = exports.PostImageComponent = exports.PostTextComponent = exports.Post = void 0;
const core_1 = require("@repandrip/core");
const static_values_1 = require("../static-values");
const url_1 = require("url");
const misc_1 = require("./misc");
const jsdom_1 = require("jsdom");
const path_1 = require("path");
const tag_1 = require("./tag");
const member_1 = require("../resource/member");
const series_1 = require("./series");
class Post extends core_1.BaseResource {
    getDocument() {
        return this._lazyGet('document', (rawData) => new jsdom_1.JSDOM(rawData.html).window.document);
    }
    getHead() {
        return this._lazyGet('documentHead', (rawData) => {
            const trimmedHTML = rawData.html
                ?.split('<!-- SE_DOC_HEADER_START -->')[1]
                ?.split('<!-- SE_DOC_HEADER_END -->')[0]
                ?.split('<br>').join('\n');
            if (!trimmedHTML) {
                return null;
            }
            const dom = new jsdom_1.JSDOM(trimmedHTML);
            return dom.window.document;
        });
    }
    getWrap() {
        return this._lazyGet('documentWrap', (rawData) => {
            const trimmedHTML = rawData.html
                ?.split('<!-- SE_DOC_CONTENTS_START -->')[1]
                ?.split('<!-- SE_DOC_CONTENTS_END -->')[0]
                ?.split('<br>').join('\n');
            if (!trimmedHTML) {
                return null;
            }
            const dom = new jsdom_1.JSDOM(trimmedHTML);
            return dom.window.document;
        });
    }
    getCardElements() {
        return this._lazyGet('documentFlex', (rawData) => {
            const elements = Array.from(this.getDocument().getElementsByTagName('script'))
                .filter((script) => ((script.getAttribute('type') === 'text/post-clip-content') &&
                (script.innerHTML.trim().startsWith('<!-- imageCard -->'))))
                .map((script) => new jsdom_1.JSDOM(`<html><body>${script.innerHTML}</body></html>`).window.document.getElementsByClassName('se_imageArea')[0]);
            return elements;
        });
    }
    get body() {
        return this._lazyGet('components', () => {
            const { client } = this;
            const bodyParsers = [
                () => {
                    const wrap = this.getWrap();
                    const componentElements = wrap?.getElementsByClassName('se_component');
                    const components = [];
                    if (!componentElements) {
                        return null;
                    }
                    for (const componentElement of Array.from(componentElements)) {
                        const componentElementClass = componentElement.getAttribute('class');
                        if (componentElementClass?.includes('se_paragraph')) {
                            components.push(new PostTextComponent(client, this, componentElement));
                        }
                        else if (componentElementClass?.includes('se_image')) {
                            components.push(new PostImageComponent(client, this, componentElement));
                        }
                        else if (componentElementClass?.includes('se_oglink')) {
                            components.push(new PostLinkComponent(client, this, componentElement));
                        }
                    }
                    return components;
                },
                () => {
                    const component = this.getDocument().getElementsByClassName('  __viewer_container_inner __webViewer_vertical_2')[0];
                    component.innerHTML = component.innerHTML.split('<br>').join('\n');
                    return component.textContent?.trim();
                },
                () => this.getCardElements().map((element) => new CardComponent(this.client, this, element.children[0]))
            ];
            const errors = [];
            for (const bodyParser of bodyParsers) {
                try {
                    const result = bodyParser();
                    if (result) {
                        return result;
                    }
                }
                catch (error) {
                    errors.push(error);
                }
            }
            throw new Error(`Cannot be parsed ${this.URL}\n${errors.map((error) => error.stack).join('\n')}`);
        });
    }
    get title() {
        return this._lazyGet('title', () => this.getDocument().getElementsByTagName('title')[0].textContent);
    }
    get ID() { return this._lazyGet('ID', (rawData) => rawData.ID); }
    get URL() { return this._lazyGet('URL', () => new url_1.URL(`${static_values_1.PostURL}?memberNo=${this.author.ID}&volumeNo=${this.ID}`)); }
    get date() {
        return this._lazyGet('date', () => new Date(Array.from(this.getDocument().head.getElementsByTagName('meta')).find((element) => element.getAttribute('property') === 'og:createdate')?.getAttribute('content') || '0'));
    }
    get author() {
        return this._lazyGet('member', (rawData) => rawData.member);
    }
    get tags() {
        return this._lazyGet('tags', () => {
            const document = this.getDocument();
            const tagsListElement = document.getElementsByClassName('tag_area')[0];
            const tags = [];
            for (const tagElement of Array.from(tagsListElement?.children || [])) {
                tags.push(new tag_1.TagMeta(this.client, tagElement));
            }
            return tags;
        });
    }
    get series() {
        return this._lazyGet('name', (rawData) => new series_1.PostSeriesMeta(this.client, this.author, (() => {
            return (this.getHead()?.getElementsByClassName('se_series')[0].parentNode ||
                new jsdom_1.JSDOM(`<html><body>${rawData.html.split('<!-- $SE3-TITLE_TOP Post Service placeholder -->')[1]
                    .split('<!-- ]]]$SE3-TITLE_TOP Post Service placeholder -->')[0]}</body></html>`).window.document.body.children[0]);
        })()));
    }
    get banner() {
        return this._lazyGet('banner', () => {
            const header = this.getHead()?.getElementsByClassName('se_background')[0];
            if (!header) {
                return null;
            }
            return new misc_1.Image(this.client, header.style.backgroundImage.split('url(')[1].slice(0, -1));
        });
    }
}
exports.Post = Post;
class PostTextComponent extends core_1.BaseResource {
    post;
    get type() { return 'text'; }
    get content() {
        return this._lazyGet('content', (rawData) => rawData.textContent?.trim());
    }
    constructor(client, post, rawData) {
        super(client, rawData);
        this.post = post;
    }
}
exports.PostTextComponent = PostTextComponent;
class PostImageComponent extends core_1.BaseResource {
    post;
    get type() { return 'image'; }
    get image() {
        return this._lazyGet('image', (rawData) => {
            const imageElement = rawData.getElementsByClassName('se_mediaImage __se_img_el')[0];
            const imageData = imageElement.getAttribute('data-src');
            return new misc_1.Image(this.client, imageData);
        });
    }
    async download(type = 'full', customPath) {
        const { client: { downloadManager, main: { options: { dataDir } } }, post, post: { author: member }, image } = this;
        const attemptDecodeURI = (str) => {
            try {
                return decodeURI(str);
            }
            catch (error) {
                return str;
            }
        };
        const filename = (() => {
            if (customPath) {
                if (typeof (customPath) === 'string') {
                    return customPath;
                }
                else if (customPath.type === 'dir') {
                    return (0, path_1.join)(customPath.path, attemptDecodeURI((0, path_1.basename)(image[type].pathname)));
                }
                else {
                    return customPath.path;
                }
            }
            else {
                return (0, path_1.join)(dataDir, 'Naver', `${member.ID} - ${member.username}`, `${post.ID} - ${post.title}`, attemptDecodeURI((0, path_1.basename)(image[type].pathname)));
            }
        })();
        return await downloadManager.download({ link: `${image[type]}`, method: 'GET' }, filename);
    }
    constructor(client, post, rawData) {
        super(client, rawData);
        this.post = post;
    }
}
exports.PostImageComponent = PostImageComponent;
class PostLinkComponent extends core_1.BaseResource {
    post;
    get type() { return 'link'; }
    get link() {
        return this._lazyGet('link', (rawData) => {
            const linkElement = rawData.getElementsByClassName('se_og_box  __se_link')[0];
            const linkData = JSON.parse(`${linkElement.getAttribute('data-linkdata')}`);
            return new url_1.URL(linkData.link);
        });
    }
    constructor(client, post, rawData) {
        super(client, rawData);
        this.post = post;
    }
}
exports.PostLinkComponent = PostLinkComponent;
class CardComponent extends core_1.BaseResource {
    post;
    get type() { return 'card'; }
    get image() {
        return this._lazyGet('image', (rawData) => new misc_1.Image(this.client, rawData.getAttribute('data-src')));
    }
    constructor(client, post, rawData) {
        super(client, rawData);
        this.post = post;
    }
}
exports.CardComponent = CardComponent;
class MemberPostMeta extends core_1.BaseResource {
    getInfo() {
        return this._lazyGet('info', (rawData) => {
            const infoPostElement = rawData.getElementsByClassName('info_post')[0];
            if (infoPostElement) {
                const [dateElement, viewElement] = Array.from(infoPostElement.children);
                const date = `${dateElement.textContent}`;
                const views = `${viewElement.textContent}`;
                return { date, views };
            }
        });
    }
    get date() {
        return this._lazyGet('date', () => new Date(this.getInfo().date));
    }
    get views() {
        return this._lazyGet('number', () => Number.parseInt(`${Number.parseInt(this.getInfo().views?.split(' ')[0].split(',').join('') || '0') || 0}`));
    }
    get title() {
        return this._lazyGet('title', (rawData) => `${rawData.getElementsByClassName('tit_feed ell')[0].textContent?.trim()}`);
    }
    get excerpt() {
        return this._lazyGet('excerpt', (rawData) => `${rawData.getElementsByClassName('text_feed ell')[0].textContent?.trim()}`);
    }
    get URL() {
        return this._lazyGet('URL', (rawData) => new url_1.URL(`${static_values_1.BaseURL}${rawData.getElementsByClassName('link_end')[0].getAttribute('href')}`));
    }
    get ID() {
        return this._lazyGet('ID', () => Number.parseInt(this.URL.searchParams.get('volumeNo') || '0') || 0);
    }
    get thumbnail() {
        return this._lazyGet('thumbnail', (rawData) => new misc_1.Image(this.client, rawData.getElementsByTagName('img')[0].getAttribute('src')));
    }
    get comments() {
        return this._lazyGet('comments', (rawData) => Number(rawData.ownerDocument.getElementById(`comment-count-${this.ID}`)?.textContent));
    }
    get series() {
        return this._lazyGet('series', (rawData) => new series_1.MemberPostSeriesMeta(this.client, this, rawData.getElementsByClassName('series_title')[0]));
    }
    author;
    get() {
        return this.author.posts.get(this.ID);
    }
    constructor(client, author, rawData) {
        super(client, rawData);
        this.author = author;
    }
}
exports.MemberPostMeta = MemberPostMeta;
class TagPostMeta extends core_1.BaseResource {
    tag;
    get ID() {
        return this._lazyGet('ID', (rawData) => Number.parseInt(this.URL.searchParams.get('volumeNo') || '0') || 0);
    }
    get URL() {
        return this._lazyGet('URL', (rawData) => new url_1.URL(`${static_values_1.BaseURL}${rawData.getElementsByClassName('link_end')[0].getAttribute('href')}`));
    }
    get date() {
        return this._lazyGet('date', (rawData) => new Date(rawData.getElementsByClassName('date_post')[0].textContent || ''));
    }
    get views() {
        return this._lazyGet('views', (rawData) => Number.parseInt(rawData.getElementsByClassName('view_post')[0]?.textContent?.trim().split(' ')[0].split(',').join('') || '0') || 0);
    }
    get title() {
        return this._lazyGet('title', (rawData) => rawData.getElementsByClassName('tit_feed ell')[0].textContent?.trim());
    }
    get excerpt() {
        return this._lazyGet('excerpt', (rawData) => rawData.getElementsByClassName('text_feed ell')[0].textContent?.trim());
    }
    get thumbnail() {
        return this._lazyGet('thumbnail', (rawData) => new misc_1.Image(this.client, rawData.getElementsByTagName('img')[0].src));
    }
    get author() {
        return this._lazyGet('author', (rawData) => new member_1.TagPostAuthorMeta(this.client, rawData.getElementsByClassName('feed_head')[0]));
    }
    get series() {
        return this._lazyGet('series', (rawData) => ((element) => element && new series_1.TagPostSeriesMeta(this.client, this, element))(rawData.getElementsByClassName('series_title')[0]));
    }
    get() {
        return this.client.getPost(this.author.ID, this.ID);
    }
    constructor(client, tag, rawData) {
        super(client, rawData);
        this.tag = tag;
    }
}
exports.TagPostMeta = TagPostMeta;
class SeriesPostMeta extends core_1.BaseResource {
    get thumbnail() {
        return this._lazyGet('thumbnail', (rawData) => new misc_1.Image(this.client, rawData.getElementsByTagName('img')[0].src));
    }
    get date() {
        return this._lazyGet('date', (rawData) => {
            const dateElement = rawData.getElementsByClassName('spot_post_date')[0];
            dateElement.removeChild(dateElement.children[0]);
            return new Date(dateElement.textContent?.trim() || '');
        });
    }
    get title() {
        return this._lazyGet('title', (rawData) => rawData.getElementsByClassName('spot_post_name')[0].textContent?.trim());
    }
    get URL() {
        return this._lazyGet('URL', (rawData) => new url_1.URL(`${static_values_1.BaseURL}${rawData.getElementsByClassName('spot_post_area')[0].getAttribute('href')}`));
    }
    get ID() {
        return this._lazyGet('ID', () => Number.parseInt(this.URL.searchParams.get('volumeNo') || '0') || 0);
    }
    series;
    author;
    get() {
        return this.client.getPost(this.author.ID, this.ID);
    }
    constructor(client, series, rawData) {
        super(client, rawData);
        this.series = series;
        this.author = series.member;
    }
}
exports.SeriesPostMeta = SeriesPostMeta;
