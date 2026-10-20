import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

export const Seo = ({ title, description, path, type = 'website' }) => {
  const { t } = useTranslation();

  const baseUrl = import.meta.env.VITE_SITE_BASE_URL;
  const siteName = t('common.siteName');
  const fullTitle = title ? `${title} · ${siteName}` : t('seo.defaultTitle');
  const resolvedDescription = description ?? t('seo.defaultDescription');
  const url = baseUrl && path ? `${baseUrl}${path}` : null;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={resolvedDescription} />
      {url && <link rel="canonical" href={url} />}
      {url && <meta property="og:url" content={url} />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={resolvedDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
    </>
  );
};

Seo.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  path: PropTypes.string,
  type: PropTypes.string,
};

export default Seo;
