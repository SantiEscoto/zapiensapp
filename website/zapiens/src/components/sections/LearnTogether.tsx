import { motion } from 'framer-motion';
import Image from 'next/image';
import styled from 'styled-components';

const Section = styled.section`
  padding: 4rem 2rem;
  background-color: var(--background-dark);
  color: var(--text-primary-dark);
  text-align: center;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Content = styled.div`
  flex: 1;
  text-align: left;
  
  @media (max-width: 768px) {
    text-align: center;
  }
`;

const Title = styled(motion.h2)`
  font-size: 3rem;
  margin-bottom: 1.5rem;
  font-family: var(--font-secondary);
  
  .highlight-learn {
    color: var(--highlight-orange);
  }
  
  .highlight-grow {
    color: var(--highlight-blue);
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

const GlobeContainer = styled(motion.div)`
  flex: 1;
  position: relative;
  height: 400px;
  
  @media (max-width: 768px) {
    width: 100%;
    height: 300px;
  }
`;

const LearnTogether = () => {
  return (
    <Section>
      <Container>
        <Content>
          <Title
            initial={{ x: -50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <span className="highlight-learn">Learn</span> Together,{' '}
            <br />
            <span className="highlight-grow">Grow</span> Together.
          </Title>
          <Description
            initial={{ x: -50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            We believe in the free access to knowledge, build by learners to learners
          </Description>
        </Content>
        
        <GlobeContainer
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Image
            src="/images/Image3.png"
            alt="Globe Illustration"
            fill
            style={{ objectFit: 'contain' }}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </GlobeContainer>
      </Container>
    </Section>
  );
};

export default LearnTogether; 