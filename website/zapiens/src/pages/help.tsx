import { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import styled from 'styled-components';
import Layout from '../components/layout/Layout';
import Head from 'next/head';
import { motion } from 'framer-motion';

const HelpContainer = styled.div`
  padding: 4rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const HelpTitle = styled.h1`
  font-size: 3rem;
  margin-bottom: 2rem;
  text-align: center;
  color: var(--text-primary);
`;

const HelpSection = styled.section`
  margin-bottom: 4rem;
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
`;

const TutorialGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
`;

const TutorialCard = styled(motion.div)`
  background: var(--background-light);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }
`;

const TutorialTitle = styled.h3`
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
`;

const TutorialDescription = styled.p`
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 1rem;
`;

const TutorialLink = styled.a`
  color: var(--highlight-orange);
  text-decoration: none;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

const Help = () => {
  const { t } = useTranslation('help');

  return (
    <Layout>
      <Head>
        <title>{t('meta.title')} | Zapiens</title>
        <meta name="description" content={t('meta.description')} />
      </Head>

      <HelpContainer>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <HelpTitle>{t('title')}</HelpTitle>

          <HelpSection>
            <SectionTitle>{t('gettingStarted.title')}</SectionTitle>
            <TutorialGrid>
              {[1, 2, 3].map((index) => (
                <TutorialCard
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <TutorialTitle>{t(`gettingStarted.step${index}.title`)}</TutorialTitle>
                  <TutorialDescription>{t(`gettingStarted.step${index}.description`)}</TutorialDescription>
                  <TutorialLink href={t(`gettingStarted.step${index}.link`)}>
                    {t('common.learnMore')} →
                  </TutorialLink>
                </TutorialCard>
              ))}
            </TutorialGrid>
          </HelpSection>

          <HelpSection>
            <SectionTitle>{t('features.title')}</SectionTitle>
            <TutorialGrid>
              {[1, 2, 3].map((index) => (
                <TutorialCard
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <TutorialTitle>{t(`features.feature${index}.title`)}</TutorialTitle>
                  <TutorialDescription>{t(`features.feature${index}.description`)}</TutorialDescription>
                  <TutorialLink href={t(`features.feature${index}.link`)}>
                    {t('common.learnMore')} →
                  </TutorialLink>
                </TutorialCard>
              ))}
            </TutorialGrid>
          </HelpSection>

          <HelpSection>
            <SectionTitle>{t('support.title')}</SectionTitle>
            <TutorialGrid>
              {[1, 2].map((index) => (
                <TutorialCard
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <TutorialTitle>{t(`support.option${index}.title`)}</TutorialTitle>
                  <TutorialDescription>{t(`support.option${index}.description`)}</TutorialDescription>
                  <TutorialLink href={t(`support.option${index}.link`)}>
                    {t('common.learnMore')} →
                  </TutorialLink>
                </TutorialCard>
              ))}
            </TutorialGrid>
          </HelpSection>
        </motion.div>
      </HelpContainer>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['help', 'common'])),
    },
  };
};

export default Help; 