import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { translations } from '../lib/i18n'
import type { Lang, Translations } from '../lib/i18n'

interface LangCtx {
  lang: Lang
  setLang: (l: Lang) => void
  t: Translations
}

const LangContext = createContext<LangCtx>({
  lang: 'en',
  setLang: () => {},
  t: translations.en,
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')
  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
