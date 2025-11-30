import styled from 'styled-components';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLanguage } from '../../providers/LanguageProvider';

const FooterContainer = styled.footer`
  width: 100%;
  padding: 1rem 5%;
  background-color: var(--background-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: var(--font-primary);
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
`;

const LanguageSelect = styled.select`
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  background: transparent;
  font-family: inherit;
  font-size: 1rem;
  color: var(--text-primary);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: var(--primary-color);
  }
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.2);
  }
  
  option {
    background-color: var(--background-light);
    color: var(--text-primary);
  }
`;

const Navigation = styled.nav`
  display: flex;
  gap: 2rem;
  align-items: center;

  a {
    color: var(--text-primary);
    text-decoration: none;
    font-size: 1rem;
    transition: color 0.3s ease;

    &:hover {
      color: var(--primary-color);
    }
  }
`;

const Logo = styled.span`
  font-family: var(--font-primary);
  font-size: 1.2rem;
  color: var(--text-primary);
`;

const Footer = () => {
  const router = useRouter();
  const { language, setLanguage, availableLanguages, languageNames } = useLanguage();
  const { locale, pathname } = router;

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value;
    router.push(pathname, pathname, { locale: newLocale });
    setLanguage(newLocale);
  };

  return (
    <FooterContainer>
      <LeftSection>
        <LanguageSelect value={locale} onChange={handleLanguageChange}>
          {availableLanguages.map((lang) => (
            <option key={lang} value={lang}>
              {languageNames[lang] || lang}
            </option>
          ))}
        </LanguageSelect>
        <Navigation>
          <Link href="/">home</Link>
          <Link href="/about">about</Link>
          <Link href="/terms">terms</Link>
          <Link href="/contact">contact</Link>
        </Navigation>
      </LeftSection>
      <Logo>zapiens</Logo>
    </FooterContainer>
  );
};

export default Footer;