import { BaseResource, SubClient } from '@repandrip/core'
import { BaseURL, PostURL } from '../static-values'
import { URL } from 'url'
import { Image } from './misc'
import { JSDOM } from 'jsdom'
import { basename, join } from 'path'
import { Tag, TagMeta } from './tag'
import { Member, TagPostAuthorMeta } from '../resource/member'
import { Client } from '../core/client'
import { Series, MemberPostSeriesMeta, PostSeriesMeta, TagPostSeriesMeta } from './series'

export class Post extends BaseResource {
  private getDocument (): Document {
    return this._lazyGet('document', (rawData) => new JSDOM(rawData.html).window.document)
  }

  private getHead (): Document | null {
    return this._lazyGet('documentHead', (rawData) => {
      const trimmedHTML = rawData.html
        ?.split('<!-- SE_DOC_HEADER_START -->')[1]
        ?.split('<!-- SE_DOC_HEADER_END -->')[0]
        ?.split('<br>').join('\n')

      if (!trimmedHTML) {
        return null
      }
      const dom = new JSDOM(trimmedHTML)

      return dom.window.document
    })
  }

  private getWrap (): Document | null {
    return this._lazyGet('documentWrap', (rawData) => {
      const trimmedHTML = rawData.html
        ?.split('<!-- SE_DOC_CONTENTS_START -->')[1]
        ?.split('<!-- SE_DOC_CONTENTS_END -->')[0]
        ?.split('<br>').join('\n')

      if (!trimmedHTML) {
        return null
      }

      const dom = new JSDOM(trimmedHTML)
      return dom.window.document
    })
  }

  private getCardElements (): Array<HTMLElement> {
    return this._lazyGet('documentFlex', (rawData) => {
      const elements = Array.from(this.getDocument().getElementsByTagName('script'))
        .filter((script) => (
          (script.getAttribute('type') === 'text/post-clip-content') &&
          (script.innerHTML.trim().startsWith('<!-- imageCard -->'))
        ))
        .map((script) => new JSDOM(`<html><body>${script.innerHTML}</body></html>`).window.document.getElementsByClassName('se_imageArea')[0])

      return elements
    })
  }

  public get body (): Array<PostComponent> | Array<CardComponent> | string {
    return this._lazyGet('components', () => {
      const { client } = this

      const bodyParsers = [
        () => {
          const wrap = this.getWrap()
          const componentElements = wrap?.getElementsByClassName('se_component')
          const components: Array<PostComponent> = []

          if (!componentElements) {
            return null
          }

          for (const componentElement of Array.from(componentElements)) {
            const componentElementClass = componentElement.getAttribute('class')

            if (componentElementClass?.includes('se_paragraph')) {
              components.push(new PostTextComponent(client, this, componentElement))
            } else if (componentElementClass?.includes('se_image')) {
              components.push(new PostImageComponent(client, this, componentElement))
            } else if (componentElementClass?.includes('se_oglink')) {
              components.push(new PostLinkComponent(client, this, componentElement))
            }
          }

          return components
        },

        () => {
          const component = this.getDocument().getElementsByClassName('  __viewer_container_inner __webViewer_vertical_2')[0]
          component.innerHTML = component.innerHTML.split('<br>').join('\n')

          return component.textContent?.trim()
        },

        () => this.getCardElements().map((element) => new CardComponent(this.client, this, element.children[0]))
      ]

      const errors: Array<Error> = []
      for (const bodyParser of bodyParsers) {
        try {
          const result = bodyParser()
          if (result) { return result }
        } catch (error: any) {
          errors.push(error)
        }
      }

      throw new Error(`Cannot be parsed ${this.URL}\n${errors.map((error) => error.stack).join('\n')}`)
    })
  }

  public get title (): string {
    return this._lazyGet('title', () => this.getDocument().getElementsByTagName('title')[0].textContent)
  }

  public get ID (): number { return this._lazyGet('ID', (rawData) => rawData.ID) }
  public get URL (): URL { return this._lazyGet('URL', () => new URL(`${PostURL}?memberNo=${this.author.ID}&volumeNo=${this.ID}`)) }

  public get date (): Date {
    return this._lazyGet('date', () => new Date(Array.from(this.getDocument().head.getElementsByTagName('meta')).find((element) => element.getAttribute('property') === 'og:createdate')?.getAttribute('content') || '0'))
  }

  public get author (): Member {
    return this._lazyGet('member', (rawData) => rawData.member)
  }

  public get tags (): Array<TagMeta> {
    return this._lazyGet('tags', () => {
      const document = this.getDocument()
      const tagsListElement = document.getElementsByClassName('tag_area')[0]
      const tags: Array<TagMeta> = []

      for (const tagElement of Array.from(tagsListElement?.children || [])) {
        tags.push(new TagMeta(this.client, tagElement))
      }

      return tags
    })
  }

  public get series (): PostSeriesMeta {
    return this._lazyGet('name', (rawData) => new PostSeriesMeta(this.client, this.author, (() => {
      return (
        this.getHead()?.getElementsByClassName('se_series')[0].parentNode ||
        new JSDOM(
          `<html><body>${
            rawData.html.split('<!-- $SE3-TITLE_TOP Post Service placeholder -->')[1]
              .split('<!-- ]]]$SE3-TITLE_TOP Post Service placeholder -->')[0]
          }</body></html>`
        ).window.document.body.children[0]
      )
    })()))
  }

  public get banner (): Image | null {
    return this._lazyGet('banner', () => {
      const header = <HTMLDivElement> this.getHead()?.getElementsByClassName('se_background')[0]
      if (!header) { return null }

      return new Image(this.client, header.style.backgroundImage.split('url(')[1].slice(0, -1))
    })
  }
}

export class PostTextComponent extends BaseResource {
  public readonly post: Post

  public get type (): 'text' { return 'text' }

  public get content (): string {
    return this._lazyGet('content', (rawData: HTMLElement) => rawData.textContent?.trim())
  }

  public constructor (client: SubClient, post: Post, rawData?: any) {
    super(client, rawData)

    this.post = post
  }
}

export class PostImageComponent extends BaseResource {
  public readonly post: Post

  public get type (): 'image' { return 'image' }

  public get image (): Image {
    return this._lazyGet('image', (rawData: HTMLElement) => {
      const imageElement = rawData.getElementsByClassName('se_mediaImage __se_img_el')[0]
      const imageData = imageElement.getAttribute('data-src')

      return new Image(this.client, imageData)
    })
  }

  public async download (type: 'full' | 'thumb' = 'full', customPath?: { path: string, type: 'file' | 'dir' } | string) {
    const { client: { downloadManager, main: { options: { dataDir } } }, post, post: { author: member }, image } = this
    const attemptDecodeURI = (str: string) => {
      try {
        return decodeURI(str)
      } catch (error) {
        return str
      }
    }
    const filename = (() => {
      if (customPath) {
        if (typeof (customPath) === 'string') {
          return customPath
        } else if (customPath.type === 'dir') {
          return join(customPath.path, attemptDecodeURI(basename(image[type].pathname)))
        } else {
          return customPath.path
        }
      } else {
        return join(dataDir, 'Naver', `${member.ID} - ${member.username}`, `${post.ID} - ${post.title}`, attemptDecodeURI(basename(image[type].pathname)))
      }
    })()

    return await downloadManager.download({ link: `${image[type]}`, method: 'GET' }, filename)
  }

  public constructor (client: SubClient, post: Post, rawData?: any) {
    super(client, rawData)

    this.post = post
  }
}

export class PostLinkComponent extends BaseResource {
  public readonly post: Post

  public get type (): 'link' { return 'link' }

  public get link (): URL {
    return this._lazyGet('link', (rawData: HTMLElement) => {
      const linkElement = rawData.getElementsByClassName('se_og_box  __se_link')[0]
      const linkData = JSON.parse(`${linkElement.getAttribute('data-linkdata')}`)

      return new URL(linkData.link)
    })
  }

  public constructor (client: SubClient, post: Post, rawData?: any) {
    super(client, rawData)

    this.post = post
  }
}

export type PostComponent =
  | PostTextComponent
  | PostImageComponent
  | PostLinkComponent

export class CardComponent extends BaseResource {
  public readonly post: Post

  public get type (): 'card' { return 'card' }

  public get image (): Image {
    return this._lazyGet('image', (rawData: HTMLElement) => new Image(this.client, rawData.getAttribute('data-src')))
  }

  public constructor (client: SubClient, post: Post, rawData?: any) {
    super(client, rawData)

    this.post = post
  }
}

export class MemberPostMeta extends BaseResource {
  private getInfo (): { date: string, views: string } {
    return this._lazyGet('info', (rawData: HTMLElement) => {
      const infoPostElement = rawData.getElementsByClassName('info_post')[0]

      if (infoPostElement) {
        const [dateElement, viewElement] = Array.from(infoPostElement.children)

        const date = `${dateElement.textContent}`
        const views = `${viewElement.textContent}`

        return { date, views }
      }
    })
  }

  public get date (): Date {
    return this._lazyGet('date', () => new Date(this.getInfo().date))
  }

  public get views (): number {
    return this._lazyGet('number', () => Number.parseInt(`${Number.parseInt(this.getInfo().views?.split(' ')[0].split(',').join('') || '0') || 0}`))
  }

  public get title (): string {
    return this._lazyGet('title', (rawData: HTMLElement) => `${rawData.getElementsByClassName('tit_feed ell')[0].textContent?.trim()}`)
  }

  public get excerpt (): string {
    return this._lazyGet('excerpt', (rawData: HTMLElement) => `${rawData.getElementsByClassName('text_feed ell')[0].textContent?.trim()}`)
  }

  public get URL (): URL {
    return this._lazyGet('URL', (rawData: HTMLElement) => new URL(`${BaseURL}${rawData.getElementsByClassName('link_end')[0].getAttribute('href')}`))
  }

  public get ID (): number {
    return this._lazyGet('ID', () => Number.parseInt(this.URL.searchParams.get('volumeNo') || '0') || 0)
  }

  public get thumbnail (): Image {
    return this._lazyGet('thumbnail', (rawData: HTMLElement) => new Image(this.client, rawData.getElementsByTagName('img')[0].getAttribute('src')))
  }

  public get comments (): number {
    return this._lazyGet('comments', (rawData: HTMLElement) => Number(rawData.ownerDocument.getElementById(`comment-count-${this.ID}`)?.textContent))
  }

  public get series (): MemberPostSeriesMeta {
    return this._lazyGet('series', (rawData: HTMLElement) => new MemberPostSeriesMeta(this.client, this, rawData.getElementsByClassName('series_title')[0]))
  }

  public readonly author: Member

  public get () {
    return <Promise<Post>> this.author.posts.get(this.ID)
  }

  public constructor (client: SubClient, author: Member, rawData?: any) {
    super(client, rawData)

    this.author = author
  }
}

export class TagPostMeta extends BaseResource {
  public readonly tag: Tag

  public get ID (): number {
    return this._lazyGet('ID', (rawData: HTMLElement) => Number.parseInt(this.URL.searchParams.get('volumeNo') || '0') || 0)
  }

  public get URL (): URL {
    return this._lazyGet('URL', (rawData: HTMLElement) => new URL(`${BaseURL}${rawData.getElementsByClassName('link_end')[0].getAttribute('href')}`))
  }

  public get date (): Date {
    return this._lazyGet('date', (rawData: HTMLElement) => new Date(rawData.getElementsByClassName('date_post')[0].textContent || ''))
  }

  public get views (): number {
    return this._lazyGet('views', (rawData: HTMLElement) => Number.parseInt(rawData.getElementsByClassName('view_post')[0]?.textContent?.trim().split(' ')[0].split(',').join('') || '0') || 0)
  }

  public get title (): string {
    return this._lazyGet('title', (rawData: HTMLElement) => rawData.getElementsByClassName('tit_feed ell')[0].textContent?.trim())
  }

  public get excerpt (): string {
    return this._lazyGet('excerpt', (rawData: HTMLElement) => rawData.getElementsByClassName('text_feed ell')[0].textContent?.trim())
  }

  public get thumbnail (): Image {
    return this._lazyGet('thumbnail', (rawData: HTMLElement) => new Image(this.client, rawData.getElementsByTagName('img')[0].src))
  }

  public get author (): TagPostAuthorMeta {
    return this._lazyGet('author', (rawData: HTMLElement) => new TagPostAuthorMeta(this.client, rawData.getElementsByClassName('feed_head')[0]))
  }

  public get series (): TagPostSeriesMeta {
    return this._lazyGet('series', (rawData: HTMLElement) => ((element) => element && new TagPostSeriesMeta(this.client, this, element))(rawData.getElementsByClassName('series_title')[0]))
  }

  public get () {
    return <Promise<Post>> (<Client> this.client).getPost(this.author.ID, this.ID)
  }

  public constructor (client: SubClient, tag: Tag, rawData?: any) {
    super(client, rawData)

    this.tag = tag
  }
}

export class SeriesPostMeta extends BaseResource {
  public get thumbnail (): Image {
    return this._lazyGet('thumbnail', (rawData: HTMLElement) => new Image(this.client, rawData.getElementsByTagName('img')[0].src))
  }

  public get date (): Date {
    return this._lazyGet('date', (rawData: HTMLElement) => {
      const dateElement = rawData.getElementsByClassName('spot_post_date')[0]
      dateElement.removeChild(dateElement.children[0])

      return new Date(dateElement.textContent?.trim() || '')
    })
  }

  public get title (): string {
    return this._lazyGet('title', (rawData: HTMLElement) => rawData.getElementsByClassName('spot_post_name')[0].textContent?.trim())
  }

  public get URL (): URL {
    return this._lazyGet('URL', (rawData: HTMLElement) => new URL(`${BaseURL}${rawData.getElementsByClassName('spot_post_area')[0].getAttribute('href')}`))
  }

  public get ID (): number {
    return this._lazyGet('ID', () => Number.parseInt(this.URL.searchParams.get('volumeNo') || '0') || 0)
  }

  public readonly series: Series
  public readonly author: Member

  public get () {
    return <Promise<Post>> (<Client> this.client).getPost(this.author.ID, this.ID)
  }

  public constructor (client: SubClient, series: Series, rawData?: any) {
    super(client, rawData)

    this.series = series
    this.author = series.member
  }
}
