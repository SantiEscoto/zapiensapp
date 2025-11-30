import { motion } from 'framer-motion';
import Image from 'next/image';
import styled from 'styled-components';

const EducationSection = styled.section`
  padding: 4rem 2rem;
  background-color: var(--background-dark);
  color: var(--text-primary-dark);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const Content = styled.div`
  flex: 1;
`;

const Title = styled(motion.h2)`
  font-size: 3rem;
  margin-bottom: 1.5rem;
  font-family: var(--font-secondary);
  
  .highlight {
    color: var(--highlight-yellow);
  }
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Description = styled(motion.p)`
  font-size: 1.25rem;
  margin-bottom: 2rem;
  max-width: 500px;
`;

const ImageContainer = styled(motion.div)`
  flex: 1;
  position: relative;
  height: 400px;
  filter: grayscale(0.3);
  mix-blend-mode: luminosity;
  
  @media (max-width: 768px) {
    width: 100%;
    height: 300px;
  }
`;

const Education = () => {
  return (
    <EducationSection>
      <Content>
        <Title
          initial={{ x: -50, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          It's time to{' '}
          <span className="highlight">update the education</span>
        </Title>
        <Description
          initial={{ x: -50, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          AI Flashcards, games that challenge your mind and a global community
          of curious changemakers
        </Description>
      </Content>
      
      <ImageContainer
        initial={{ x: 50, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <Image
          src="/images/image2.png"
          alt="Education Update"
          fill
          style={{ objectFit: 'cover' }}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </ImageContainer>
    </EducationSection>
  );
};

export default Education; 