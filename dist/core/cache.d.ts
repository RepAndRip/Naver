interface Cache<T> {
    [key: string | symbol]: T;
}
export declare function createCacheManager<T>(): Cache<T>;
export {};
