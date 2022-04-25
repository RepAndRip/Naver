import { JSDOM } from 'jsdom'
import { BaseManager, SubClient } from '@repandrip/core'
import { Member } from '../resource/member'
import { MemberPostMeta, Post } from '../resource/post'
import { MemberPostsListURL, PostURL } from '../static-values'
import { parseJSON } from '../resource/misc'
import { createCacheManager } from '../core/cache'

export class PostManager extends BaseManager {
  private readonly _cachedPostList = createCacheManager<Array<MemberPostMeta> | undefined>()
  private readonly _cachedPost = createCacheManager<Post | undefined>()

  public member: Member

  public async list (page: number = 1): Promise<Array<MemberPostMeta>> {
    const { _cachedPostList } = this
    const cacheKey = `${page}`
    const cached = _cachedPostList[cacheKey]
    if (cached !== undefined) {
      return cached
    }

    const result = await (async () => {
      const data = parseJSON(await this.request({ method: 'GET', link: MemberPostsListURL, query: { memberNo: `${this.member.ID}`, fromNo: `${page || 1}` }, is404Error: true }) || '')
      const list: Array<MemberPostMeta> = []

      if (!JSON.parse(data.emptyList)) {
        const dom = new JSDOM(data.html)
        const { window: { document } } = dom

        const listElement = document.getElementsByClassName('lst_feed')[0]

        for (const listPostMeta of Array.from(listElement.children)) {
          list.push(new MemberPostMeta(this.client, this.member, listPostMeta))
        }
      }

      return list
    })()

    return (_cachedPostList[cacheKey] = result)
  }

  public async get (volumeID: number) {
    const { _cachedPost } = this
    const cacheKey = `${volumeID}`

    if (cacheKey in _cachedPost) {
      return _cachedPost[cacheKey]
    }

    const result = await (async () => {
      const data = await this.request({ method: 'GET', link: PostURL, query: { memberNo: `${this.member.ID}`, volumeNo: `${volumeID}` } })

      if (data && (!data.includes('alert(\'포스트가 존재하지 않습니다.\');'))) {
        return new Post(this.client, { html: data, ID: volumeID, member: this.member })
      }
    })()

    return (_cachedPost[cacheKey] = result)
  }

  public constructor (client: SubClient, member: Member) {
    super(client)

    this.member = member
  }
}
