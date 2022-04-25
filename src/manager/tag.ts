import { BaseManager } from '@repandrip/core'
import { parseJSON } from '../resource/misc'
import { Tag, TagMeta } from '../resource/tag'
import { TagAuthorList, TagPostsURL, TagURL, TagRelatedURL } from '../static-values'
import { TagPostMeta } from '../resource/post'
import { TagMemberMeta } from '../resource/member'
import { JSDOM } from 'jsdom'
import { createCacheManager } from '../core/cache'

export class TagManager extends BaseManager {
  private readonly _cachedTag = createCacheManager<Tag>()
  private readonly _cachedTagPostList = createCacheManager<Array<TagPostMeta>>()
  private readonly _cachedTagMemberList = createCacheManager<Array<TagMemberMeta>>()
  private readonly _cachedRelatedTagLlist = createCacheManager<Array<TagMeta>>()

  public async get (name: string) {
    const { _cachedTag } = this
    const cacheKey = `${name}`

    if (cacheKey in _cachedTag) {
      return _cachedTag[name]
    }

    return (_cachedTag[cacheKey] = new Tag(this.client, await this.request({ link: TagURL, method: 'GET', query: { tag: name }, is404Error: true })))
  }

  public async getRelatedTags (name: string) {
    const { _cachedRelatedTagLlist } = this
    const cacheKey = `${name}`

    if (cacheKey in _cachedRelatedTagLlist) {
      return _cachedRelatedTagLlist[cacheKey]
    }

    const result = await (async () => {
      const data = await this.request({ link: TagRelatedURL, method: 'GET', query: { tag: `${name}` }, is404Error: true })
      const tags: Array<TagMeta> = []
      const { window: { document } } = new JSDOM(data)
      const relatedTagsElement = document.getElementsByClassName('tag_area')[0]

      for (const tagElement of Array.from(relatedTagsElement.children)) {
        tags.push(new TagMeta(this.client, tagElement))
      }

      return tags
    })()

    return (_cachedRelatedTagLlist[cacheKey] = result)
  }

  public async getPostList (name: string, sort: 'relevant' | 'recent' = 'relevant', page: number = 1) {
    const { _cachedTagPostList } = this
    const cacheKey: string = `${name}-${page}`

    if (cacheKey in _cachedTagPostList) {
      return _cachedTagPostList[cacheKey]
    }

    const result = await (async () => {
      const tag = await this.get(name)

      const data = parseJSON(await this.request({ link: TagPostsURL, method: 'GET', query: { tag: name, sortType: `${sort === 'recent' ? 'createDate' : 'rel'}.dsc`, fromNo: `${page}` }, is404Error: true }) || '')
      const list: Array<TagPostMeta> = []
      const dom = new JSDOM(data.html)
      const { window: { document } } = dom
      const listElement = document.getElementsByClassName('lst_feed lst_feed_tag')[0]

      for (const tagPostMeta of Array.from(listElement?.children || [])) {
        list.push(new TagPostMeta(this.client, tag, tagPostMeta))
      }

      return list
    })()

    return (_cachedTagPostList[cacheKey] = result)
  }

  public async getMemberList (name: string, page: number = 1) {
    const { _cachedTagMemberList } = this
    const cacheKey: string = `${name}-${page}`

    if (cacheKey in _cachedTagMemberList) {
      return _cachedTagMemberList[cacheKey]
    }

    const result = await (async () => {
      const tag = await this.get(name)
      const list: Array<TagMemberMeta> = []

      try {
        const data = await this.request({ link: TagAuthorList, method: 'GET', query: { tag: name, fromNo: `${page}` }, is404Error: true }) || ''
        const dom = new JSDOM(data)
        const { window: { document } } = dom
        const listElement = document.getElementsByClassName('flick-container')[0]

        for (const tagMemberMeta of Array.from(listElement.getElementsByClassName('user_info_item'))) {
          list.push(new TagMemberMeta(this.client, tag, tagMemberMeta))
        }
      } catch (error) {
      }

      return list
    })()

    return (_cachedTagMemberList[cacheKey] = result)
  }
}
