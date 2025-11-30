export const FONTS = {
  bold: 'DINNextRoundedLTPro-Bold',
  regular: 'DINNextRoundedLTPro-Regular'
} as const;

export const FONT_ASSETS = {
  [FONTS.bold]: require('../../assets/fonts/DINNextRoundedLTPro-Bold.otf'),
  [FONTS.regular]: require('../../assets/fonts/DINNextRoundedLTPro-Regular.otf')
} as const;