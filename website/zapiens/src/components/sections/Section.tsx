import styled from 'styled-components';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ReactNode } from 'react';

interface SectionProps {
  title: ReactNode;
  subtitle?: string;
  image?: {
    src: string;
    alt: string;
  };
  background?: 'light' | 'dark';
  children?: ReactNode;
  reverse?: boolean;
}

const SectionContainer = styled(motion.section)<{ background?: 'light' | 'dark' }>`
  padding: 4rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: ${props => props.background === 'dark' ? 'var(--background-dark)' : 'var(--background-light)'};
  color: ${props => props.background === 'dark' ? 'var(--text-primary-dark)' : 'var(--text-primary)'};
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    gap: 2rem;
  }
`;

const ContentWrapper = styled.div<{ reverse?: boolean }>`
  flex: 1;
  order: ${props => props.reverse ? 2 : 1};
  
  @media (max-width: 768px) {
    order: 1;
  }
`;

const ImageWrapper = styled.div<{ reverse?: boolean }>`
  flex: 1;
  position: relative;
  height: 400px;
  order: ${props => props.reverse ? 1 : 2};
  
  @media (max-width: 768px) {
    order: 2;
    height: 300px;
  }
`;

const Title = styled.h2`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  
  .highlight {
    color: var(--highlight-yellow);
  }
  
  .highlight-orange {
    color: var(--highlight-orange);
  }
  
  .highlight-blue {
    color: var(--highlight-blue);
  }
`;

const Section = ({ 
  title, 
  subtitle, 
  image, 
  background = 'light',
  children,
  reverse = false
}: SectionProps) => {
  return (
    <SectionContainer
      background={background}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <ContentWrapper reverse={reverse}>
        <Title>{title}</Title>
        {subtitle && <p>{subtitle}</p>}
        {children}
      </ContentWrapper>
      
      {image && (
        <ImageWrapper reverse={reverse}>
          <Image
            src={image.src}
            alt={image.alt}
            fill
            style={{ objectFit: 'contain' }}
            loading="lazy"
            sizes="(max-width: 768px) 100vw, 50vw"
            quality={85}
          />
        </ImageWrapper>
      )}
    </SectionContainer>
  );
};

export default Section; 