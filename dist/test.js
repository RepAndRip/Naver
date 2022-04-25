"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const core_1 = tslib_1.__importDefault(require("@repandrip/core"));
const _1 = tslib_1.__importStar(require("."));
const client = new core_1.default.Client({ downloadParallelCount: 10 });
const naverClient = new _1.default.Client(client);
client.on('debug', console.log);
const test = {
    scrapeAll: async () => {
        const tagList = await naverClient.tags.get('TWICE');
        let tagPosts;
        let tagPostsPage = 1;
        try {
            while ((tagPosts = await tagList.getPostList('recent', tagPostsPage))) {
                for (const postMeta of tagPosts) {
                    const post = await postMeta.get();
                    const body = post?.body;
                    if (Array.isArray(body)) {
                        await Promise.all(body.map(async (component) => component instanceof _1.PostImageComponent && await component.download().catch(() => { })));
                    }
                }
                tagPostsPage++;
            }
        }
        catch (e) {
        }
    },
    getAuthors: async () => {
        const member = await naverClient.getMember(29747755);
        const posts = await member?.posts.list();
        const output = [];
        for (const post of posts || []) {
            output.push(post.author);
        }
        return output;
    },
    getSpecificMember: async () => await naverClient.getMember(45234535234),
    getSpecificPost: async () => (await (await (await naverClient.getPost(29747755, 31770080))?.series.get())?.getPosts())?.[0].get(),
    getRelatedTags: async () => {
        const tag = await naverClient.getTag('트와이스');
        const related = await tag.getRelatedTags();
        return related;
    },
    getTag: async () => {
        const tag = await naverClient.getTag('twice');
        const posts = await tag.getPostList('recent');
        return posts;
    }
};
test.getTag().then((data) => console.log(JSON.parse(JSON.stringify(data) || 'null')));
