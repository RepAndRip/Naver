/// <reference types="node" />
import { BaseResource } from '@repandrip/core';
import { URL } from 'url';
export declare class Image extends BaseResource {
    get full(): URL;
    get thumb(): URL;
    download(type?: 'full' | 'thumb', customPath?: {
        path: string;
        type: 'file' | 'dir';
    } | string): Promise<string>;
}
export declare function parseJSON(data: string): any;
