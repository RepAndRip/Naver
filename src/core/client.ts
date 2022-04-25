import { SubClient, Client as CoreClient } from '@repandrip/core'
import { MemberManager } from '../manager/member'
import { TagManager } from '../manager/tag'

export class Client extends SubClient {
  public readonly members: MemberManager
  public readonly tags: TagManager

  public getMember (memberId: number) {
    return this.members.get(memberId)
  }

  public getTag (name: string) {
    return this.tags.get(name)
  }

  public async getPost (memberId: number, volumeId: number) {
    return await (await this.getMember(memberId))?.posts.get(volumeId)
  }

  public async getSeries (memberId: number, seriesId: number) {
    return await (await this.getMember(memberId))?.series.get(seriesId)
  }

  public constructor (client: CoreClient) {
    super(client)

    this.members = new MemberManager(this)
    this.tags = new TagManager(this)
  }
}
