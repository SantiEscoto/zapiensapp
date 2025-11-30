import { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import styled from 'styled-components';
import Layout from '../components/layout/Layout';
import Head from 'next/head';
import { motion } from 'framer-motion';

const FAQContainer = styled.div`
  padding: 4rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const FAQTitle = styled.h1`
  font-size: 3rem;
  margin-bottom: 2rem;
  text-align: center;
  color: var(--text-primary);
`;

const FAQSection = styled.div`
  margin-bottom: 3rem;
`;

const FAQQuestion = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
`;

const FAQAnswer = styled.p`
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
`;

const FAQ = () => {
  const { t } = useTranslation('faq');

  return (
    <Layout>
      <Head>
        <title>{t('meta.title')} | Zapiens</title>
        <meta name="description" content={t('meta.description')} />
      </Head>

      <FAQContainer>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <FAQTitle>{t('title')}</FAQTitle>

          <FAQSection>
            <FAQQuestion>{t('general.question1')}</FAQQuestion>
            <FAQAnswer>{t('general.answer1')}</FAQAnswer>

            <FAQQuestion>{t('general.question2')}</FAQQuestion>
            <FAQAnswer>{t('general.answer2')}</FAQAnswer>

            <FAQQuestion>{t('general.question3')}</FAQQuestion>
            <FAQAnswer>{t('general.answer3')}</FAQAnswer>
          </FAQSection>

          <FAQSection>
            <FAQQuestion>{t('features.question1')}</FAQQuestion>
            <FAQAnswer>{t('features.answer1')}</FAQAnswer>

            <FAQQuestion>{t('features.question2')}</FAQQuestion>
            <FAQAnswer>{t('features.answer2')}</FAQAnswer>
          </FAQSection>

          <FAQSection>
            <FAQQuestion>{t('contact.question1')}</FAQQuestion>
            <FAQAnswer>{t('contact.answer1')}</FAQAnswer>
          </FAQSection>
        </motion.div>
      </FAQContainer>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['faq', 'common'])),
    },
  };
};

export default FAQ; 