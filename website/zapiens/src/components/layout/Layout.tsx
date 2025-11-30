import { ReactNode } from 'react';
import styled from 'styled-components';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import Header from './Header';
import Footer from './Footer';

const LayoutContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  --icon-filter: none;
  background-color: var(--background-light);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
  
  &.dark {
    --icon-filter: invert(1);
    background-color: var(--background-dark);
    color: var(--text-primary-dark);
  }
`;

const HeaderContent = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LogoContainer = styled.div`
  position: relative;
  width: 240px;
  height: 80px;
  transition: filter 0.3s ease;

  img {
    filter: var(--icon-filter);
  }
`;

const IconsContainer = styled.div`
  display: flex;
  gap: 3rem;
  align-items: center;
`;

const IconWrapper = styled.div<{ $isTheme?: boolean }>`
  position: relative;
  width: ${props => props.$isTheme ? '80px' : '50px'};
  height: ${props => props.$isTheme ? '80px' : '50px'};
  cursor: pointer;
  transition: transform 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: scale(1.1);
  }

  img {
    filter: var(--icon-filter);
  }
`;

const Main = styled.main`
  flex: 1;
  width: 100%;
`;

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <LayoutContainer className={theme}>
      <Header />
      <Main>{children}</Main>
      <Footer />
    </LayoutContainer>
  );
};

export default Layout;