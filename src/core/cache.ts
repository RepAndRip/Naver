interface Cache<T> {
  [key: string | symbol]: T
}

export function createCacheManager<T> () {
  return new Proxy(<Cache<T>> {}, {
    get: (target, index) => target[index],
    set: (target, index, value) => {
      /*
      target[index] = value

      const targetValues = Object.values(target).length
      if (targetValues >= 50) {
        let targetI = 0

        for (const index in target) {
          if (targetI < (targetValues - 50)) {
            delete target[index]
          } else {
            break
          }

          console.log(`Delete ${index} since the cache reached 50`)
          targetI++
        }
      }

      console.log(Object.values(target).length)
      */
      return true
    }
  })
}
