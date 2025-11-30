import { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import styled from 'styled-components';
import Layout from '../components/layout/Layout';
import Head from 'next/head';
import { motion } from 'framer-motion';
import Image from 'next/image';

const NewsContainer = styled.div`
  padding: 4rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const NewsTitle = styled.h1`
  font-size: 3rem;
  margin-bottom: 2rem;
  text-align: center;
  color: var(--text-primary);
`;

const NewsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
`;

const NewsCard = styled(motion.article)`
  background: var(--background-light);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }
`;

const NewsImage = styled.div`
  position: relative;
  width: 100%;
  height: 200px;
`;

const NewsContent = styled.div`
  padding: 1.5rem;
`;

const NewsDate = styled.span`
  color: var(--text-secondary);
  font-size: 0.9rem;
`;

const NewsCardTitle = styled.h2`
  font-size: 1.5rem;
  margin: 1rem 0;
  color: var(--text-primary);
`;

const NewsExcerpt = styled.p`
  color: var(--text-secondary);
  line-height: 1.6;
`;

const News = () => {
  const { t } = useTranslation('news');

  const newsItems = [
    {
      id: 1,
      date: '2024-03-25',
      title: t('items.item1.title'),
      excerpt: t('items.item1.excerpt'),
      image: '/images/news/ai-update.jpg'
    },
    {
      id: 2,
      date: '2024-03-20',
      title: t('items.item2.title'),
      excerpt: t('items.item2.excerpt'),
      image: '/images/news/community.jpg'
    },
    {
      id: 3,
      date: '2024-03-15',
      title: t('items.item3.title'),
      excerpt: t('items.item3.excerpt'),
      image: '/images/news/features.jpg'
    }
  ];

  return (
    <Layout>
      <Head>
        <title>{t('meta.title')} | Zapiens</title>
        <meta name="description" content={t('meta.description')} />
      </Head>

      <NewsContainer>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <NewsTitle>{t('title')}</NewsTitle>
          <NewsGrid>
            {newsItems.map((item) => (
              <NewsCard
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: item.id * 0.1 }}
              >
                <NewsImage>
                  <Image
                    src={item.image}
                    alt={item.title}
                    layout="fill"
                    objectFit="cover"
                  />
                </NewsImage>
                <NewsContent>
                  <NewsDate>{item.date}</NewsDate>
                  <NewsCardTitle>{item.title}</NewsCardTitle>
                  <NewsExcerpt>{item.excerpt}</NewsExcerpt>
                </NewsContent>
              </NewsCard>
            ))}
          </NewsGrid>
        </motion.div>
      </NewsContainer>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['news', 'common'])),
    },
  };
};

export default News; 