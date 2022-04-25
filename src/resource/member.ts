import { BaseResource, SubClient } from '@repandrip/core'
import { JSDOM } from 'jsdom'
import { URL } from 'url'
import { Tag, TagMeta } from '../resource/tag'
import { Client } from '../core/client'
import { PostManager } from '../manager/post'
import { MemberURL, BaseURL } from '../static-values'
import { Image } from '../resource/misc'
import { SeriesManager } from '../manager/series'

export class Member extends BaseResource {
  private getDocument (): Document { return this._lazyGet('dom', (rawData): Document => new JSDOM(rawData.html).window.document) }
  private getInfo (): { followers: number, following: number, posts: number } {
    return this._lazyGet('infowrap', () => {
      const infoWrapElement = this.getDocument().getElementsByClassName('info_wrap')[0]
      const [
        folowerCountElement,
        followingCountElement,
        postCountElement
      ] = Array.from(infoWrapElement.children)

      const parseFunc = (text: string | null) => Number.parseInt(text?.split(',').join('') || '0') || 0

      const followers = parseFunc(folowerCountElement.getElementsByClassName('num')[0].textContent)
      const following = parseFunc(followingCountElement.getElementsByClassName('num')[0].textContent)
      const posts = parseFunc(postCountElement.getElementsByClassName('num')[0].textContent)

      return { followers, following, posts }
    })
  }

  public get username (): string {
    return this._lazyGet('username', () => this.getDocument().getElementsByTagName('title')[0].textContent)
  }

  public get avatar (): Image {
    return this._lazyGet('avatarURL', () => new Image(this.client, this.getDocument().getElementsByClassName('thum_wrap')[0].getElementsByTagName('img')[0].getAttribute('src')))
  }

  public get followers (): number { return this.getInfo().followers }
  public get following (): number { return this.getInfo().following }
  public get postCount (): number { return this.getInfo().posts }

  public get isVerified (): boolean {
    return this._lazyGet('isVerified', () => !!this.getDocument().getElementsByClassName('ico_official_large')[0])
  }

  public get ID (): number { return this._lazyGet('memberNo', (rawData) => rawData.ID) }
  public get URL (): URL { return this._lazyGet('URL', () => `${MemberURL}?memberNo=${this.ID}`) }

  public posts: PostManager
  public series: SeriesManager

  public getProfile () {
    return <Promise<MemberProfile>> (<Client> this.client).members.getProfile(this.ID)
  }

  public constructor (client: SubClient, rawData: { html: string, [key: string]: any }) {
    super(client, rawData)

    this.posts = new PostManager(client, this)
    this.series = new SeriesManager(client, this)
  }
}

export class MemberProfile extends BaseResource {
  private getDocument (): Document {
    return this._lazyGet('document', (rawData) => new JSDOM(rawData.html).window.document)
  }

  public get description (): string {
    return this._lazyGet('description', () => {
      const descriptionElement = this.getDocument().getElementsByClassName('profile_area profile_desc')[0]
      descriptionElement.innerHTML = descriptionElement.innerHTML.split('<br>').join('\n')

      return descriptionElement.textContent?.trim()
    })
  }

  public get badges (): Array<string> {
    return this._lazyGet('badges', () => {
      const badgesElement = this.getDocument().getElementsByClassName('badge_area')[0]
      const badges: Array<string> = []

      for (const badgeElement of Array.from(badgesElement.children)) {
        badges.push(`${badgeElement.textContent}`)
      }

      return badges
    })
  }

  public get links (): Array<URL> {
    return this._lazyGet('links', () => {
      const linksElement = this.getDocument().getElementsByClassName('profile_area profile_sns as_topline')[0]
      const links: Array<URL> = []

      for (const linkElement of Array.from(linksElement.children)) {
        if (linkElement.tagName.toLowerCase() === 'a') {
          links.push(new URL(`${linkElement.getAttribute('href')}`))
        }
      }

      return links
    })
  }

  public get tags (): Array<TagMeta> {
    return this._lazyGet('tags', () => {
      const tagsElement = this.getDocument().getElementsByClassName('tag_area')[0]
      const links: Array<TagMeta> = []

      for (const tagElement of Array.from(tagsElement.children)) {
        links.push(new TagMeta(this.client, tagElement))
      }

      return links
    })
  }

  public readonly member: Member

  public constructor (client: SubClient, member: Member, rawData?: any) {
    super(client, rawData)

    this.member = member
  }
}

export class TagMemberMeta extends BaseResource {
  public readonly tag: Tag

  public get username (): string {
    return this._lazyGet('username', (rawData: HTMLElement) => rawData.getElementsByClassName('post_tit ell')[0].textContent?.trim())
  }

  public get followers (): number {
    return this._lazyGet('followers', (rawData: HTMLElement) => {
      const followerElement = rawData.getElementsByClassName('post_follower_status')[0]
      followerElement.removeChild(followerElement.children[0])

      return Number.parseInt(followerElement.textContent || '0') || 0
    })
  }

  public get avatar (): Image {
    return this._lazyGet('avatar', (rawData: HTMLElement) => new Image(this.client, rawData.getElementsByTagName('img')[0].getAttribute('src')))
  }

  public get verified (): boolean {
    return this._lazyGet('verified', (rawData: HTMLElement) => !!rawData.getElementsByClassName('ico_official_big')[0])
  }

  public get tags (): Array<TagMeta> {
    return this._lazyGet('tags', (rawData: HTMLElement) => {
      const tags: Array<TagMeta> = []

      for (const tagElement of Array.from(rawData.getElementsByClassName('tag_area')[0].children)) {
        tags.push(new TagMeta(this.client, tagElement))
      }

      return tags
    })
  }

  public get URL (): URL {
    return this._lazyGet('URL', (rawData: HTMLElement) => new URL(`${BaseURL}${rawData.getElementsByTagName('a')[0].textContent}`))
  }

  public get ID (): number {
    return this._lazyGet('ID', () => Number.parseInt(this.URL.searchParams.get('memberNo') || '0') || 0)
  }

  public constructor (client: SubClient, tag: Tag, rawData?: any) {
    super(client, rawData)

    this.tag = tag
  }
}

export class TagPostAuthorMeta extends BaseResource {
  public get URL (): URL {
    return this._lazyGet('URL', (rawData: HTMLElement) => new URL(`${BaseURL}${rawData.getElementsByClassName('link')[0].getAttribute('href')}`))
  }

  public get ID (): number {
    return this._lazyGet('ID', () => Number.parseInt(this.URL.searchParams.get('memberNo') || '0') || 0)
  }

  public get username (): string {
    return this._lazyGet('username', (rawData: HTMLElement) => rawData.getElementsByClassName('ell')[0].textContent?.trim())
  }

  public get verified (): boolean {
    return this._lazyGet('verified', (rawData: HTMLElement) => !!rawData.getElementsByClassName('ico_official')[0])
  }

  public get badges (): Array<string> {
    return this._lazyGet('badges', (rawData: HTMLElement) => {
      const badgesElement = rawData.getElementsByClassName('writer_badge')[0]
      const badges: Array<string> = []

      for (const badge of Array.from(badgesElement?.children || [])) {
        const badgeText = badge.textContent?.trim()

        if (badgeText) {
          badges.push(badgeText)
        }
      }

      return badges
    })
  }

  public get avatar (): Image {
    return this._lazyGet('avatar', (rawData: HTMLElement) => new Image(this.client, rawData.getElementsByTagName('img')[0].getAttribute('src')))
  }
}
