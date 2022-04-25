import { BaseManager, SubClient } from '@repandrip/core';
import { Member } from '../resource/member';
import { Series } from '../resource/series';
import { SeriesPostMeta } from '../resource/post';
export declare class SeriesManager extends BaseManager {
    private readonly _cachedSeries;
    private readonly _cachedSeriesPosts;
    readonly member: Member;
    get(seriesID: number): Promise<Series | undefined>;
    getPosts(seriesID: number, page?: number): Promise<SeriesPostMeta[] | undefined>;
    constructor(client: SubClient, member: Member);
}
