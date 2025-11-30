import { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import styled from 'styled-components';
import Layout from '../components/layout/Layout';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { useState } from 'react';

const SearchContainer = styled.div`
  padding: 4rem 2rem;
  max-width: 800px;
  margin: 0 auto;
`;

const SearchTitle = styled.h1`
  font-size: 3rem;
  margin-bottom: 2rem;
  text-align: center;
  color: var(--text-primary);
`;

const SearchBox = styled.div`
  position: relative;
  margin-bottom: 3rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 1.5rem;
  padding-left: 4rem;
  font-size: 1.2rem;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  background-color: var(--background-light);
  color: var(--text-primary);
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: var(--highlight-orange);
    box-shadow: 0 0 0 3px rgba(255, 165, 0, 0.1);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  color: var(--text-secondary);
`;

const SearchResults = styled.div`
  display: grid;
  gap: 1.5rem;
`;

const ResultCard = styled(motion.div)`
  background: var(--background-light);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }
`;

const ResultTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
`;

const ResultDescription = styled.p`
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 1rem;
`;

const ResultMeta = styled.div`
  display: flex;
  gap: 1rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
`;

const Search = () => {
  const { t } = useTranslation('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([
    {
      id: 1,
      title: t('results.item1.title'),
      description: t('results.item1.description'),
      category: t('results.item1.category'),
      date: t('results.item1.date'),
    },
    {
      id: 2,
      title: t('results.item2.title'),
      description: t('results.item2.description'),
      category: t('results.item2.category'),
      date: t('results.item2.date'),
    },
    {
      id: 3,
      title: t('results.item3.title'),
      description: t('results.item3.description'),
      category: t('results.item3.category'),
      date: t('results.item3.date'),
    },
  ]);

  return (
    <Layout>
      <Head>
        <title>{t('meta.title')} | Zapiens</title>
        <meta name="description" content={t('meta.description')} />
      </Head>

      <SearchContainer>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <SearchTitle>{t('title')}</SearchTitle>

          <SearchBox>
            <SearchIcon>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </SearchIcon>
            <SearchInput
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchBox>

          <SearchResults>
            {results.map((result, index) => (
              <ResultCard
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <ResultTitle>{result.title}</ResultTitle>
                <ResultDescription>{result.description}</ResultDescription>
                <ResultMeta>
                  <span>{result.category}</span>
                  <span>•</span>
                  <span>{result.date}</span>
                </ResultMeta>
              </ResultCard>
            ))}
          </SearchResults>
        </motion.div>
      </SearchContainer>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['search', 'common'])),
    },
  };
};

export default Search; 