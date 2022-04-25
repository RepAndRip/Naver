import { BaseManager } from '@repandrip/core'
import { parseJSON } from '../resource/misc'
import { Member, MemberProfile } from '../resource/member'
import { MemberProfileURL, MemberURL } from '../static-values'
import { createCacheManager } from '../core/cache'

export class MemberManager extends BaseManager {
  private readonly _cachedMembers = createCacheManager<Member | undefined>()
  private readonly _cachedMemberProfiles = createCacheManager<MemberProfile | undefined>()

  public async get (ID: number) {
    const { _cachedMembers } = this
    const cacheKey = `${ID}`

    if (cacheKey in _cachedMembers) {
      return _cachedMembers[cacheKey]
    }

    const result = await (async () => {
      const data = await this.request({ method: 'GET', link: MemberURL, query: { memberNo: `${ID}` } })

      if (data && (!data.includes('<strong class="msg">페이지를 찾을 수 없습니다.</strong>'))) {
        return new Member(this.client, { html: data, ID })
      }
    })()

    return (_cachedMembers[cacheKey] = result)
  }

  public async getProfile (ID: number) {
    const { _cachedMemberProfiles } = this
    const cacheKey = `${ID}`

    if (cacheKey in _cachedMemberProfiles) {
      return _cachedMemberProfiles[cacheKey]
    }

    const result = await (async () => {
      const member = await this.get(ID)

      if (member) {
        const data = parseJSON(await this.request({ method: 'GET', link: MemberProfileURL, query: { memberNo: `${ID}` } }) || '')

        if (data) {
          return new MemberProfile(this.client, member, { html: data.html, ID })
        }
      }
    })()

    return (_cachedMemberProfiles[cacheKey] = result)
  }
}
