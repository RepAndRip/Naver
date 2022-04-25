"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const core_1 = require("@repandrip/core");
const member_1 = require("../manager/member");
const tag_1 = require("../manager/tag");
class Client extends core_1.SubClient {
    members;
    tags;
    getMember(memberId) {
        return this.members.get(memberId);
    }
    getTag(name) {
        return this.tags.get(name);
    }
    async getPost(memberId, volumeId) {
        return await (await this.getMember(memberId))?.posts.get(volumeId);
    }
    async getSeries(memberId, seriesId) {
        return await (await this.getMember(memberId))?.series.get(seriesId);
    }
    constructor(client) {
        super(client);
        this.members = new member_1.MemberManager(this);
        this.tags = new tag_1.TagManager(this);
    }
}
exports.Client = Client;
