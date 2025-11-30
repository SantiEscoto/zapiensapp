import { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import styled from 'styled-components';
import Layout from '../components/layout/Layout';
import Head from 'next/head';
import { motion } from 'framer-motion';

const TermsContainer = styled.div`
  padding: 4rem 2rem;
  max-width: 800px;
  margin: 0 auto;
`;

const TermsTitle = styled.h1`
  font-size: 3rem;
  margin-bottom: 2rem;
  text-align: center;
  color: var(--text-primary);
`;

const TermsSection = styled.section`
  margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
`;

const SectionContent = styled.div`
  color: var(--text-secondary);
  line-height: 1.8;
  
  p {
    margin-bottom: 1rem;
  }
  
  ul {
    margin-bottom: 1rem;
    padding-left: 1.5rem;
    
    li {
      margin-bottom: 0.5rem;
    }
  }
`;

const Terms = () => {
  const { t } = useTranslation('terms');

  return (
    <Layout>
      <Head>
        <title>{t('meta.title')} | Zapiens</title>
        <meta name="description" content={t('meta.description')} />
      </Head>

      <TermsContainer>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <TermsTitle>{t('title')}</TermsTitle>

          <TermsSection>
            <SectionTitle>{t('sections.introduction.title')}</SectionTitle>
            <SectionContent>
              <p>{t('sections.introduction.content')}</p>
            </SectionContent>
          </TermsSection>

          <TermsSection>
            <SectionTitle>{t('sections.definitions.title')}</SectionTitle>
            <SectionContent>
              <p>{t('sections.definitions.content')}</p>
              <ul>
                {[1, 2, 3].map((index) => (
                  <li key={index}>{t(`sections.definitions.item${index}`)}</li>
                ))}
              </ul>
            </SectionContent>
          </TermsSection>

          <TermsSection>
            <SectionTitle>{t('sections.usage.title')}</SectionTitle>
            <SectionContent>
              <p>{t('sections.usage.content')}</p>
              <ul>
                {[1, 2, 3].map((index) => (
                  <li key={index}>{t(`sections.usage.item${index}`)}</li>
                ))}
              </ul>
            </SectionContent>
          </TermsSection>

          <TermsSection>
            <SectionTitle>{t('sections.privacy.title')}</SectionTitle>
            <SectionContent>
              <p>{t('sections.privacy.content')}</p>
            </SectionContent>
          </TermsSection>

          <TermsSection>
            <SectionTitle>{t('sections.contact.title')}</SectionTitle>
            <SectionContent>
              <p>{t('sections.contact.content')}</p>
            </SectionContent>
          </TermsSection>
        </motion.div>
      </TermsContainer>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['terms', 'common'])),
    },
  };
};

export default Terms; 