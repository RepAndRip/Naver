import { BaseResource } from '@repandrip/core'
import { JSDOM } from 'jsdom'
import { Client } from '../core/client'
import { BaseURL, TagURL } from '../static-values'

export class Tag extends BaseResource {
  private getDocument (): Document {
    return this._lazyGet('document', (rawData) => new JSDOM(rawData).window.document)
  }

  private getButtonArea (): HTMLElement {
    return this._lazyGet('buttonArea', () => this.getDocument().getElementsByClassName('btn_area')[0])
  }

  public get URL (): URL {
    return this._lazyGet('link', () => new URL(`${TagURL}?tag=${this.name}`))
  }

  public get name (): string {
    return this._lazyGet('name', () => this.getDocument().getElementsByClassName('title')[0].textContent?.trim().slice(1))
  }

  public get postCount (): number {
    const [postCountElement] = Array.from(this.getButtonArea().children)

    Array.from(postCountElement.children).forEach((element) => postCountElement.removeChild(element))

    return Number.parseInt(postCountElement.textContent?.split(',').join('') || '0') || 0
  }

  public get followers (): number {
    const [,, followerCountElement] = Array.from(this.getButtonArea().children)

    Array.from(followerCountElement.children).forEach((element) => followerCountElement.removeChild(element))

    return Number.parseInt(followerCountElement.textContent?.split(',').join('') || '0') || 0
  }

  public async getPostList (sort?: 'relevant' | 'recent', page?: number) {
    return (<Client> this.client).tags.getPostList(this.name, sort, page)
  }

  public async getMemberList (page?: number) {
    return (<Client> this.client).tags.getMemberList(this.name, page)
  }

  public async getRelatedTags () {
    return (<Client> this.client).tags.getRelatedTags(this.name)
  }
}

export class TagMeta extends BaseResource {
  public get URL (): URL {
    return this._lazyGet('link', (rawData: HTMLAnchorElement) => new URL(`${BaseURL}${rawData.href}`))
  }

  public get name (): string {
    return this._lazyGet('name', () => this.URL.searchParams.get('tag'))
  }

  public get () {
    return (<Client> this.client).tags.get(this.name)
  }
}
