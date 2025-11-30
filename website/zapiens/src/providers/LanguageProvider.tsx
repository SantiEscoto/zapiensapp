import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';

type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
  availableLanguages: string[];
  languageNames: Record<string, string>;
  nextLanguage: () => void;
  prevLanguage: () => void;
};

const availableLanguages = ['en', 'es', 'fr', 'de', 'ko', 'ru', 'kk', 'pt'];

const languageNames: Record<string, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  ko: '한국어',
  ru: 'Русский',
  kk: 'Қазақша',
  pt: 'Português'
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  availableLanguages,
  languageNames,
  nextLanguage: () => {},
  prevLanguage: () => {}
});

export const useLanguage = () => useContext(LanguageContext);

type LanguageProviderProps = {
  children: ReactNode;
};

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguageState] = useState('en');
  const router = useRouter();
  
  // Update language and change router locale
  const setLanguage = (lang: string) => {
    if (!availableLanguages.includes(lang)) return;
    
    setLanguageState(lang);
    
    // Change the route to the new locale
    const { pathname, asPath, query } = router;
    router.push({ pathname, query }, asPath, { locale: lang });
    
    // Store language preference in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLanguage', lang);
    }
  };
  
  // Function to get next language in the list
  const nextLanguage = () => {
    const currentIndex = availableLanguages.indexOf(language);
    const nextIndex = (currentIndex + 1) % availableLanguages.length;
    setLanguage(availableLanguages[nextIndex]);
  };
  
  // Function to get previous language in the list
  const prevLanguage = () => {
    const currentIndex = availableLanguages.indexOf(language);
    const prevIndex = (currentIndex - 1 + availableLanguages.length) % availableLanguages.length;
    setLanguage(availableLanguages[prevIndex]);
  };

  // Detect browser language
  const detectBrowserLanguage = () => {
    if (typeof window === 'undefined') return 'en';
    
    const browserLang = navigator.language.split('-')[0];
    return availableLanguages.includes(browserLang) ? browserLang : 'en';
  };
  
  // Initialize language from localStorage, browser language, or router locale
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('preferredLanguage');
      if (savedLanguage && availableLanguages.includes(savedLanguage)) {
        setLanguageState(savedLanguage);
      } else if (router.locale && availableLanguages.includes(router.locale)) {
        setLanguageState(router.locale);
      } else {
        const browserLang = detectBrowserLanguage();
        setLanguageState(browserLang);
      }
    }
  }, [router.locale]);

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      availableLanguages, 
      languageNames,
      nextLanguage,
      prevLanguage
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageProvider;