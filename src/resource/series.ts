import { BaseResource, SubClient } from '@repandrip/core'
import { Member } from './member'
import { URL } from 'url'
import { BaseURL, SeriesURL } from '../static-values'
import { JSDOM } from 'jsdom'
import { TagMeta } from '../resource/tag'
import { MemberPostMeta, Post, SeriesPostMeta, TagPostMeta } from '../resource/post'
import { TagPostAuthorMeta } from '../resource/member'
import { Client } from '../core/client'

export class Series extends BaseResource {
  private getDocument (): Document {
    return this._lazyGet('document', (rawData) => new JSDOM(rawData.html).window.document)
  }

  public get title (): string {
    return this._lazyGet('title', () => this.getDocument().getElementsByClassName('tit_series')[0].textContent?.trim())
  }

  public get posts (): number {
    return this._lazyGet('posts', () => Number.parseInt(this.getDocument().getElementsByClassName('series_follow_area')[0].children[0].children[1].textContent?.split(' ')[0].split(',').join('') || '0') || 0)
  }

  public get followers (): number {
    return this._lazyGet('followers', () => Number.parseInt(this.getDocument().getElementsByClassName('series_follow_area')[0].children[2].children[1].textContent?.split(' ')[0].split(',').join('') || '0') || 0)
  }

  public get tags (): Array<TagMeta> {
    return this._lazyGet('tags', () => {
      const tagsListElement = this.getDocument().getElementsByClassName('tag_area')[0]
      const tags: Array<TagMeta> = []

      for (const tagElement of Array.from(tagsListElement.children || [])) {
        tags.push(new TagMeta(this.client, tagElement))
      }

      return tags
    })
  }

  public get URL (): URL {
    return this._lazyGet('URL', () => new URL(`${SeriesURL}?memberNo=${this.member.ID}&seriesNo${this.ID}`))
  }

  public get ID (): number {
    return this._lazyGet('ID', (rawData) => rawData.seriesID)
  }

  public readonly member: Member

  public getPosts (page?: number) {
    return <Promise<Array<SeriesPostMeta>>> this.member.series.getPosts(this.ID, page)
  }

  public constructor (client: SubClient, member: Member, rawData?: any) {
    super(client, rawData)

    this.member = member
  }
}

export class PostSeriesMeta extends BaseResource {
  public readonly member: Member

  public get title (): string {
    return this._lazyGet('name', (rawData: HTMLAnchorElement) => {
      const seriesDiv = rawData.children[0]
      Array.from(seriesDiv.children).forEach((seriesChildElement) => seriesDiv.removeChild(seriesChildElement))

      return seriesDiv.textContent?.trim()
    })
  }

  public get URL (): URL {
    return this._lazyGet('URL', (rawData: HTMLAnchorElement) => new URL(`${BaseURL}${rawData.href}`))
  }

  public get ID (): number {
    return this._lazyGet('ID', () => Number.parseInt(this.URL.searchParams.get('seriesNo') || '0') || 0)
  }

  public get () {
    return <Promise<Series>> this.member.series.get(this.ID)
  }

  public constructor (client: SubClient, member: Member, rawData?: any) {
    super(client, rawData)

    this.member = member
  }
}

export class MemberPostSeriesMeta extends BaseResource {
  public get URL (): URL {
    return this._lazyGet('URL', (rawData: HTMLElement) => new URL(`${BaseURL}${rawData.getAttribute('href')}`))
  }

  public get ID (): number {
    return this._lazyGet('ID', () => Number.parseInt(this.URL.searchParams.get('seriesNo') || '0') || 0)
  }

  public get title (): string {
    return this._lazyGet('title', (rawData: HTMLElement) => {
      const seriesTitleElement = rawData.getElementsByClassName('ell')[0]
      seriesTitleElement.removeChild(seriesTitleElement.children[0])

      return seriesTitleElement.textContent
    })
  }

  public readonly post: MemberPostMeta
  public readonly member: Member

  public get () {
    return <Promise<Post>> this.member.posts.get(this.ID)
  }

  public constructor (client: SubClient, listPostMeta: MemberPostMeta, rawData?: any) {
    super(client, rawData)

    this.post = listPostMeta
    this.member = listPostMeta.author
  }
}

export class TagPostSeriesMeta extends BaseResource {
  public get URL (): URL {
    return this._lazyGet('URL', (rawData: HTMLElement) => new URL(`${BaseURL}${rawData.getAttribute('href')}`))
  }

  public get ID (): number {
    return this._lazyGet('ID', () => Number.parseInt(this.URL.searchParams.get('seriesNo') || '0') || 0)
  }

  public get title (): string {
    return this._lazyGet('title', (rawData: HTMLElement) => {
      const seriesTitleElement = rawData.getElementsByClassName('ell')[0]
      seriesTitleElement.removeChild(seriesTitleElement.children[0])

      return seriesTitleElement.textContent?.trim()
    })
  }

  public readonly post: TagPostMeta
  public readonly member: TagPostAuthorMeta

  public get () {
    return <Promise<Post>> (<Client> this.client).getPost(this.member.ID, this.ID)
  }

  public constructor (client: SubClient, listPostMeta: TagPostMeta, rawData?: any) {
    super(client, rawData)

    this.post = listPostMeta
    this.member = listPostMeta.author
  }
}
