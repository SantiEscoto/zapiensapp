import { useState, useRef, useEffect, useCallback, memo } from 'react';
import styled from 'styled-components';
import { useLanguage } from '../../providers/LanguageProvider';

const LanguageSwitcherContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
  font-family: var(--font-secondary);
  font-size: 1rem;
`;

const CurrentLanguage = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  transition: opacity 0.2s ease;
  background: none;
  border: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  text-transform: lowercase;
  
  &:hover {
    opacity: 0.8;
  }
  
  &:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
`;

const LanguageText = styled.span`
  color: var(--text-primary);
`;

const DropdownIcon = styled.span<{ $isOpen: boolean }>`
  transition: transform 0.2s ease;
  transform: ${({ $isOpen }) => $isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
  font-size: 0.75rem;
  opacity: 0.7;
`;

const LanguageDropdown = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 0.5rem;
  background-color: var(--background);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 0.5rem 0;
  z-index: 10;
  opacity: ${({ $isOpen }) => $isOpen ? 1 : 0};
  visibility: ${({ $isOpen }) => $isOpen ? 'visible' : 'hidden'};
  transform: ${({ $isOpen }) => $isOpen ? 'translateY(0)' : 'translateY(-10px)'};
  transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
  min-width: 120px;
  
  [data-theme='dark'] & {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`;

const LanguageOption = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: opacity 0.2s ease;
  text-transform: lowercase;
  
  &:hover {
    opacity: 0.8;
  }
  
  &:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: -2px;
  }
`;

const SwipeArea = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  touch-action: pan-y;
`;

const LanguageSwitcher = () => {
  const { language, setLanguage, availableLanguages, languageNames } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <LanguageSwitcherContainer ref={dropdownRef}>
      <CurrentLanguage 
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Select language, current language: ${languageNames[language] || 'language'}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="language-dropdown"
      >
        <LanguageText>language</LanguageText>
        <DropdownIcon $isOpen={isOpen}>▾</DropdownIcon>
      </CurrentLanguage>
      
      <LanguageDropdown 
        $isOpen={isOpen}
        role="listbox"
        id="language-dropdown"
        aria-label="Available languages"
      >
        {availableLanguages.map((lang) => (
          <LanguageOption
            key={lang}
            onClick={() => {
              setLanguage(lang);
              setIsOpen(false);
            }}
            role="option"
            aria-selected={lang === language}
          >
            {languageNames[lang] || lang}
          </LanguageOption>
        ))}
      </LanguageDropdown>
    </LanguageSwitcherContainer>
  );
};

export default memo(LanguageSwitcher);