import { useTranslation } from 'react-i18next';
import Seo from '../../components/Seo.jsx';
import FAQ from './sections/FAQ.jsx';

//* Route wrapper for /preguntas-frecuentes - owns the page <Seo>; the FAQ
//* section itself is also embedded in the homepage
export const FAQPage = () => {
  const { t } = useTranslation();

  return (
    <>
      <Seo
        title={t('index.faq.title')}
        description={t('seo.faqDescription')}
        path="/preguntas-frecuentes"
      />
      <FAQ />
    </>
  );
};

export default FAQPage;
