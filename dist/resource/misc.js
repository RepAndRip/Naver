"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJSON = exports.Image = void 0;
const core_1 = require("@repandrip/core");
const path_1 = require("path");
const url_1 = require("url");
class Image extends core_1.BaseResource {
    get full() {
        return this._lazyGet('full', (rawData) => {
            const parsed = new url_1.URL(rawData);
            parsed.searchParams.delete('type');
            return parsed;
        });
    }
    get thumb() {
        return this._lazyGet('thumb', (rawData) => new url_1.URL(rawData));
    }
    async download(type = 'full', customPath) {
        const { client: { downloadManager, main: { options: { dataDir } } } } = this;
        const filename = (() => {
            if (customPath) {
                if (typeof (customPath) === 'string') {
                    return customPath;
                }
                else if (customPath.type === 'dir') {
                    return (0, path_1.join)(customPath.path, (0, path_1.basename)(this[type].pathname));
                }
                else {
                    return customPath.path;
                }
            }
            else {
                return (0, path_1.join)(dataDir, 'Naver', (0, path_1.basename)(this[type].pathname));
            }
        })();
        return await downloadManager.download({ link: `${this[type]}`, method: 'GET' }, filename);
    }
}
exports.Image = Image;
function parseJSON(data) {
    // eslint-disable-next-line no-eval
    return eval(`(${data})`);
}
exports.parseJSON = parseJSON;
