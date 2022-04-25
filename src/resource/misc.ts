import { BaseResource } from '@repandrip/core'
import { basename, join } from 'path'
import { URL } from 'url'

export class Image extends BaseResource {
  public get full (): URL {
    return this._lazyGet('full', (rawData) => {
      const parsed = new URL(rawData)

      parsed.searchParams.delete('type')
      return parsed
    })
  }

  public get thumb (): URL {
    return this._lazyGet('thumb', (rawData) => new URL(rawData))
  }

  public async download (type: 'full' | 'thumb' = 'full', customPath?: { path: string, type: 'file' | 'dir' } | string) {
    const { client: { downloadManager, main: { options: { dataDir } } } } = this
    const filename = (() => {
      if (customPath) {
        if (typeof (customPath) === 'string') {
          return customPath
        } else if (customPath.type === 'dir') {
          return join(customPath.path, basename(this[type].pathname))
        } else {
          return customPath.path
        }
      } else {
        return join(dataDir, 'Naver', basename(this[type].pathname))
      }
    })()

    return await downloadManager.download({ link: `${this[type]}`, method: 'GET' }, filename)
  }
}

export function parseJSON (data: string) {
  // eslint-disable-next-line no-eval
  return eval(`(${data})`)
}
