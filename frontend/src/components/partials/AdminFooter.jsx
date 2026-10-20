import { NavLink } from 'react-router';
import { useTranslation } from 'react-i18next';

const AdminFooter = () => {
  const { t } = useTranslation();
  const columnOne = t('footer.admin.columnOne', { returnObjects: true });
  const columnTwo = t('footer.admin.columnTwo', { returnObjects: true });
  const columnThree = t('footer.admin.columnThree', { returnObjects: true });

  return (
    <div className="footer">
      <nav className="container py-2 border-bottom footer">
        <div className="">
          <ul>
            <li>
              <NavLink to="/terminos-condiciones">{t('footer.links.terms')}</NavLink>
            </li>
            <li>{t('footer.admin.title')}</li>
            {columnOne.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>

        <div className="">
          <ul>
            {columnTwo.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div className="">
          <ul>
            {columnThree.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </nav>
    </div>
  );
};

export default AdminFooter;
