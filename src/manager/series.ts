import { BaseManager, SubClient } from '@repandrip/core'
import { Member } from '../resource/member'
import { Series } from '../resource/series'
import { SeriesPostMeta } from '../resource/post'
import { SeriesURL, SeriesPostsURL } from '../static-values'
import { JSDOM } from 'jsdom'
import { parseJSON } from '../resource/misc'
import { createCacheManager } from '../core/cache'

export class SeriesManager extends BaseManager {
  private readonly _cachedSeries = createCacheManager<Series | undefined>()
  private readonly _cachedSeriesPosts = createCacheManager<Array<SeriesPostMeta> | undefined>()

  public readonly member: Member

  public async get (seriesID: number) {
    const { _cachedSeries } = this
    const cacheKey = `${seriesID}`

    if (cacheKey in _cachedSeries) {
      return _cachedSeries[cacheKey]
    }
    const result = await (async () => {
      const data = await this.request({ link: SeriesURL, method: 'GET', query: { memberNo: `${this.member.ID}`, seriesNo: `${seriesID}` } })

      if (data && (!data.includes('alert(\'시리즈를 다시 확인해주세요.\');'))) {
        return new Series(this.client, this.member, { html: data, seriesID })
      }
    })()

    return (_cachedSeries[cacheKey] = result)
  }

  public async getPosts (seriesID: number, page: number = 1) {
    const { _cachedSeriesPosts } = this
    const cacheKey = `${seriesID}-${page}`

    if (cacheKey in _cachedSeriesPosts) {
      return _cachedSeriesPosts[cacheKey]
    }

    const result = await (async () => {
      const series = await this.get(seriesID)

      if (series) {
        const data = await this.request({ link: SeriesPostsURL, method: 'GET', query: { memberNo: `${this.member.ID}`, totalCount: `${series.posts}`, seriesNo: `${seriesID}`, fromNo: `${page}` } })

        if (data) {
          const { window: { document } } = new JSDOM(parseJSON(data).html)
          const seriesPostsElement = document.getElementsByClassName('list_spot_post _post_list')[0]
          const seriesPosts: Array<SeriesPostMeta> = []

          for (const postElement of Array.from(seriesPostsElement.children || [])) {
            seriesPosts.push(new SeriesPostMeta(this.client, series, postElement))
          }

          return seriesPosts
        }
      }
    })()

    return (_cachedSeriesPosts[cacheKey] = result)
  }

  public constructor (client: SubClient, member: Member) {
    super(client)

    this.member = member
  }
}
