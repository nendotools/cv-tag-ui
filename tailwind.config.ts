import type { Config } from 'tailwindcss'
import colors from 'tailwindcss/colors'

export default <Partial<Config>>{
  safelist: [
    ...[2, 3, 4, 5, 6].map(s => `grid-cols-${s}`)
  ]
}
