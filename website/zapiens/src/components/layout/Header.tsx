import { useState, useCallback, memo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styled from 'styled-components';
import { useTheme } from 'next-themes';
import { useTranslation } from 'next-i18next';
import { useLanguage } from '../../providers/LanguageProvider';
import LanguageSwitcher from './LanguageSwitcher';

const HeaderContainer = styled.header<{ $isScrolled: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: ${props => props.$isScrolled ? 'var(--color-background)' : 'transparent'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  transition: all 0.3s ease;
  box-shadow: ${props => props.$isScrolled ? '0 2px 8px rgba(0, 0, 0, 0.2)' : 'none'};
  height: 80px;
  backdrop-filter: ${props => props.$isScrolled ? 'blur(10px)' : 'none'};
`;

const Logo = styled.div<{ $isScrolled: boolean }>`
  display: flex;
  align-items: center;
  cursor: pointer;
  font-family: var(--font-secondary);
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--color-neon-orange);
  text-shadow: 0 0 10px rgba(255, 140, 0, 0.5);
  transition: all 0.3s ease;
  
  &:hover {
    text-shadow: 0 0 20px rgba(255, 140, 0, 0.8);
  }
`;

const Navigation = styled.nav<{ $isScrolled: boolean }>`
  display: flex;
  align-items: center;
  gap: 2rem;
  role: "navigation";
  aria-label: "Main navigation";
  transition: all 0.3s ease;
`;

const NavItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0.5rem;
  border-radius: 4px;
  color: var(--color-neon-orange);
  text-transform: uppercase;
  font-weight: bold;
  letter-spacing: 1px;
  
  &:hover {
    transform: translateY(-2px);
    text-shadow: 0 0 10px rgba(255, 140, 0, 0.7);
    
    img {
      filter: brightness(1.2) drop-shadow(0 0 5px rgba(255, 140, 0, 0.7));
    }
  }
`;

const NavIcon = styled.div`
  width: 45px;
  height: 45px;
  position: relative;
  margin-bottom: 0.25rem;
  
  img {
    transition: all 0.3s ease;
  }
`;

const NavText = styled.span`
  font-size: 0.75rem;
  color: var(--color-neon-orange);
  text-align: center;
`;

const DownloadButton = styled.button<{ $isScrolled: boolean }>`
  padding: 0.75rem 1.5rem;
  background-color: transparent;
  color: var(--color-neon-orange);
  border: 2px solid var(--color-neon-orange);
  border-radius: 50px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 0 10px rgba(255, 140, 0, 0.3);
  
  &:hover {
    background-color: var(--color-neon-orange);
    color: var(--color-background);
    transform: translateY(-2px);
    box-shadow: 0 0 20px rgba(255, 140, 0, 0.5);
  }
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ThemeToggle = styled.button`
  cursor: pointer;
  width: 45px;
  height: 45px;
  position: relative;
  background: none;
  border: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
  filter: var(--icon-filter);
  
  &:hover {
    background-color: var(--background-hover);
  }
  
  &:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
`;

// Memoized NavItem component for better performance
const MemoizedNavItem = memo(({ item, t }: { item: { name: string; icon: string; href: string; label: string }; t: (key: string) => string }) => (
  <Link href={item.href} passHref legacyBehavior>
    <NavItem as="a" role="menuitem" tabIndex={0}>
      <NavIcon>
        <Image 
          src={item.icon} 
          alt={t(`nav.${item.name}`)} 
          fill 
          style={{ objectFit: 'contain' }}
          loading="lazy"
        />
      </NavIcon>
      <NavText>{item.label}</NavText>
    </NavItem>
  </Link>
));

MemoizedNavItem.displayName = 'MemoizedNavItem';

const Header = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      // Calculamos la altura de la primera sección (Hero)
      const heroSection = document.querySelector('section');
      const heroHeight = heroSection ? heroSection.offsetHeight : 0;
      
      // Solo cambiamos el estado cuando salimos de la primera sección
      setIsScrolled(scrollPosition > heroHeight);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);
  
  const navItems = [
    { name: 'news', icon: '/news_icon.png', href: '/news', label: 'NEWS' },
    { name: 'help', icon: '/help_icon.png', href: '/help', label: 'HELP' },
    { name: 'faq', icon: '/faq_icon.png', href: '/faq', label: 'FAQ' },
    { name: 'search', icon: '/search_icon.png', href: '/search', label: 'SEARCH' },
  ];
  
  return (
    <HeaderContainer $isScrolled={isScrolled}>
      <Link href="/" passHref legacyBehavior>
        <Logo as="a" aria-label="Home" $isScrolled={isScrolled}>
          <Image 
            src={isScrolled ? "/icon.png" : "/full_logo.png"}
            alt="Zapiens Logo" 
            width={180} 
            height={45} 
            priority 
            loading="eager"
            style={{ 
              filter: theme === 'dark' ? 'invert(1)' : 'none',
              transition: 'all 0.3s ease',
            }}
          />
        </Logo>
      </Link>
      
      <Navigation role="navigation" aria-label="Main navigation" $isScrolled={isScrolled}>
        {navItems.map((item) => (
          <MemoizedNavItem key={item.name} item={item} t={t} />
        ))}
      </Navigation>
      
      <Controls>
        <DownloadButton $isScrolled={isScrolled}>
          GET STARTED
        </DownloadButton>
        
        <ThemeToggle 
          onClick={toggleTheme} 
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          <Image 
            src={theme === 'light' ? '/icon.png' : '/icon.png'} 
            alt={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} 
            fill 
            style={{ objectFit: 'contain' }}
            loading="lazy"
          />
        </ThemeToggle>
      </Controls>
    </HeaderContainer>
  );
};

export default memo(Header);