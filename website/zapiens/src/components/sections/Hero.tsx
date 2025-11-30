import { motion } from 'framer-motion';
import Image from 'next/image';
import styled from 'styled-components';

const HeroContainer = styled(motion.section)`
  min-height: 90vh;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  background-color: var(--background-light);
  position: relative;
  overflow: hidden;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const CollageContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 800px;
  height: 400px;
  margin: 2rem auto;
`;

const CollageElement = styled(motion.div)`
  position: absolute;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-10px);
  }
`;

const MainTitle = styled(motion.h1)`
  font-size: 3.5rem;
  text-align: center;
  margin-bottom: 1.5rem;
  font-family: var(--font-secondary);
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled(motion.p)`
  font-size: 1.5rem;
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
  color: var(--text-secondary);
`;

const GetStartedButton = styled(motion.button)`
  padding: 1rem 2rem;
  font-size: 1.125rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 2rem;
  font-family: var(--font-primary);
  
  &:hover {
    transform: scale(1.05);
  }
`;

const collageElements = [
  { src: '/images/image1.png', alt: 'Red Panda', style: { top: '10%', left: '10%', width: '200px', height: '150px' } },
  { src: '/images/Image3.png', alt: 'Bird', style: { top: '5%', right: '15%', width: '180px', height: '150px' } },
  { src: '/images/image2.png', alt: 'Car', style: { bottom: '15%', left: '20%', width: '220px', height: '150px' } },
  { src: '/images/Image4.png', alt: 'Plant', style: { bottom: '10%', right: '20%', width: '200px', height: '150px' } },
];

const IconsContainer = styled.div`
  display: flex;
  gap: 1rem;
`;

const IconWrapper = styled.div`
  position: relative;
  width: 24px;
  height: 24px;
`;

const Hero = () => {
  return (
    <HeroContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <MainContent>
        <MainTitle
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          One app to learn it all
        </MainTitle>
        
        <Subtitle
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Join us and be part of this revolution
        </Subtitle>
        
        <CollageContainer>
          {collageElements.map((element, index) => (
            <CollageElement
              key={element.alt}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                delay: 0.2 * (index + 1),
                type: "spring",
                stiffness: 100
              }}
              style={element.style}
            >
              <Image
                src={element.src}
                alt={element.alt}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </CollageElement>
          ))}
        </CollageContainer>
        
        <GetStartedButton
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Get now
        </GetStartedButton>
      </MainContent>
    </HeroContainer>
  );
};

export default Hero; 