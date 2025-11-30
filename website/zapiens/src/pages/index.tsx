import { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import styled from 'styled-components';
import Image from 'next/image';
import Layout from '../components/layout/Layout';
import Section from '../components/sections/Section';
import { Suspense, useTransition, useState, useEffect } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { siteConfig } from '../config/metadata';
import EducationSection from '../components/sections/Education';
import LearnTogether from '../components/sections/LearnTogether';

const HeroSection = styled.section`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('/images/city-background.svg') bottom center;
    background-size: cover;
    opacity: 0.2;
    z-index: 0;
  }
`;

const HeroContent = styled.div`
  flex: 1;
  z-index: 1;
  max-width: 600px;
`;

const NeonTitle = styled(motion.h1)`
  font-size: 4.5rem;
  line-height: 1.2;
  margin-bottom: 2rem;
  color: var(--color-neon-orange);
  text-shadow: 0 0 10px rgba(255, 140, 0, 0.7),
               0 0 20px rgba(255, 140, 0, 0.5),
               0 0 30px rgba(255, 140, 0, 0.3);
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-top: 2rem;
`;

const HeroIllustration = styled(motion.div)`
  flex: 1;
  position: relative;
  height: 600px;
  z-index: 1;

  .character {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 500px;
    height: auto;
  }

  .floating-element {
    position: absolute;
    animation: float 3s ease-in-out infinite;
  }
`;

const Education = styled.section`
  padding: 6rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--background-dark);
  color: var(--text-primary-dark);
  position: relative;
  overflow: hidden;
  
  .content {
    flex: 1;
    max-width: 500px;
    z-index: 2;
  }
  
  h2 {
    font-size: 3rem;
    margin-bottom: 1.5rem;
    line-height: 1.2;
    
    .highlight {
      color: var(--highlight-yellow);
      position: relative;
      
      &::after {
        content: '';
        position: absolute;
        bottom: -4px;
        left: 0;
        width: 100%;
        height: 4px;
        background-color: var(--highlight-yellow);
        opacity: 0.3;
      }
    }
  }
  
  .illustration {
    position: relative;
    width: 500px;
    height: 400px;
    
    img {
      border-radius: 16px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
    }
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    padding: 4rem 1rem;
    
    .content {
      max-width: 100%;
    }
    
    h2 {
      font-size: 2.5rem;
    }
    
    .illustration {
      width: 100%;
      height: 300px;
      margin-top: 2rem;
    }
  }
`;

const Learn = styled.section`
  padding: 4rem 2rem;
  text-align: center;
  background-color: var(--background-light);
  
  h2 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    font-family: var(--font-secondary);
  }
`;

const Tutor = styled.section`
  padding: 4rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--background-light);
  
  h2 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    
    .highlight {
      color: var(--highlight-orange);
    }
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    gap: 2rem;
  }
`;

const Global = styled.section`
  padding: 4rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--background-dark);
  color: var(--text-primary-dark);
  
  h2 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    
    .highlight-learn {
      color: var(--highlight-orange);
    }
    
    .highlight-grow {
      color: var(--highlight-blue);
    }
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    gap: 2rem;
  }
`;

const GetStarted = styled(motion.button)`
  padding: 1.25rem 2.5rem;
  font-size: 1.25rem;
  font-weight: bold;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:focus-visible {
    outline: 2px solid var(--highlight-yellow);
    outline-offset: 2px;
  }
`;

const LoadingFallback = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  color: var(--text-primary);
`;

const ImageContainer = styled.div`
  position: relative;
  width: 60%;  // Controla el ancho de la imagen - Aumenta para hacerla más grande
  height: 100vh;  // Controla la altura - 100vh significa toda la altura de la pantalla
  margin-right: -5%;  // Empuja la imagen un poco hacia la derecha
  
  img {
    object-fit: contain !important;  // Mantiene la proporción de la imagen
  }
  
  @media (max-width: 768px) {  // Ajustes para móviles
    width: 100%;
    height: 60vh;
    margin-right: 0;
  }
`;

const ScrollToTop = styled(motion.button)`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background-color: var(--primary-color);
  color: white;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  
  &:hover {
    transform: scale(1.1);
  }
`;

const MainHeroSection = styled.section`
  min-height: 100vh;  // Altura mínima - toda la pantalla
  display: flex;
  align-items: center;  // Centra verticalmente
  justify-content: space-between;  // Espacio entre imagen y texto
  padding: 0 5%;  // Espaciado lateral
  max-width: 1600px;  // Ancho máximo de la sección
  margin: 0 auto;  // Centra horizontalmente
  gap: 2rem;  // Espacio entre imagen y texto
  overflow: hidden;  // Evita scroll horizontal

  @media (max-width: 768px) {  // Ajustes para móviles
    flex-direction: column;
    padding: 2rem 5%;
    text-align: center;
    gap: 1rem;
  }
`;

const TextContent = styled.div`
  width: 40%;  // Ancho del contenedor de texto
  display: flex;
  flex-direction: column;
  gap: 2rem;  // Espacio entre título y subtítulo

  @media (max-width: 768px) {  // Ajustes para móviles
    width: 100%;
  }
`;

const Title = styled.h1`
  font-size: 4rem;  // Tamaño del texto - Ajusta para hacerlo más grande/pequeño
  font-weight: bold;
  color: var(--text-primary);
  line-height: 1.2;

  @media (max-width: 768px) {  // Ajustes para móviles
    font-size: 3rem;
  }
`;

const Subtitle = styled.h2`
  font-size: 2.5rem;  // Tamaño del texto - Ajusta para hacerlo más grande/pequeño
  color: var(--text-secondary);
  line-height: 1.4;

  @media (max-width: 768px) {  // Ajustes para móviles
    font-size: 2rem;
  }
`;

const Home = () => {
  const { t } = useTranslation('common');
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!mounted) {
    return <LoadingFallback>Loading...</LoadingFallback>;
  }

  return (
    <Layout>
      <Head>
        <title>{siteConfig.title}</title>
        <meta name="description" content={siteConfig.description} />
        <meta property="og:title" content={siteConfig.title} />
        <meta property="og:description" content={siteConfig.description} />
        <meta property="og:image" content={siteConfig.ogImage} />
        <meta property="og:url" content={siteConfig.url} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content={siteConfig.twitterHandle} />
        <meta name="twitter:title" content={siteConfig.title} />
        <meta name="twitter:description" content={siteConfig.description} />
        <meta name="twitter:image" content={siteConfig.ogImage} />
        <link rel="canonical" href={siteConfig.url} />
      </Head>

      <HeroSection>
        <HeroContent>
          <NeonTitle
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            ONE APP<br />
            TO LEARN<br />
            IT ALL
          </NeonTitle>
          <ButtonContainer>
            <motion.button
              className="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              GET STARTED
            </motion.button>
            <motion.button
              className="button secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              DISCOVER PROJECTS
            </motion.button>
          </ButtonContainer>
        </HeroContent>

        <HeroIllustration
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Image
            src="/images/hero-character.svg"
            alt="Zapiens Character"
            className="character"
            width={500}
            height={600}
          />
        </HeroIllustration>
      </HeroSection>
      <EducationSection />
      <LearnTogether />

      <Suspense fallback={<LoadingFallback>Loading education section...</LoadingFallback>}>
        <Section
          title={
            <>
              {t('section2.title.part1')}{' '}
              <span className="highlight">{t('section2.title.highlight')}</span>{' '}
              {t('section2.title.part2')}
            </>
          }
          subtitle={t('section2.subtitle')}
          image={{
            src: '/image2.png',
            alt: 'Education Update'
          }}
          background="dark"
        >
          <GetStarted
            onClick={() => {
              startTransition(() => {
                // Aquí iría la lógica del botón
              });
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {t('section2.cta')}
          </GetStarted>
        </Section>
      </Suspense>

      <Suspense fallback={<LoadingFallback>Loading learn section...</LoadingFallback>}>
        <Section
          title={t('section3.title')}
          subtitle={t('section3.subtitle')}
          background="light"
        />
      </Suspense>

      <Suspense fallback={<LoadingFallback>Loading tutor section...</LoadingFallback>}>
        <Section
          title={
            <>
              {t('section4.title.part1')}{' '}
              <span className="highlight-orange">{t('section4.title.highlight')}</span>{' '}
              {t('section4.title.part2')}
            </>
          }
          subtitle={t('section4.subtitle')}
          image={{
            src: '/Image4.png',
            alt: 'Personal Tutor'
          }}
          reverse
        />
      </Suspense>

      <Suspense fallback={<LoadingFallback>Loading global section...</LoadingFallback>}>
        <Section
          title={
            <>
              <span className="highlight-orange">{t('section5.title.highlight1')}</span>{' '}
              {t('section5.title.part1')}{' '}
              <span className="highlight-blue">{t('section5.title.highlight2')}</span>{' '}
              {t('section5.title.part2')}
            </>
          }
          subtitle={t('section5.subtitle')}
          background="dark"
        />
      </Suspense>

      {showScrollTop && (
        <ScrollToTop
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={scrollToTop}
          aria-label="Volver arriba"
        >
          ↑
        </ScrollToTop>
      )}
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }: { locale?: string }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'])),
    },
  };
};

export default Home;