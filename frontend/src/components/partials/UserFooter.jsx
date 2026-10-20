import { useTranslation } from 'react-i18next';

const UserFooter = () => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <p>{t('footer.copyright', { year, siteName: t('common.siteName') })}</p>
    </footer>
  );
};

export default UserFooter;
