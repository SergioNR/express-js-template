import MainHero from './sections/Hero.jsx';
import HowItWorks from './sections/HowItWorks.jsx';
import Features from './sections/Features.jsx';
import FAQ from './sections/FAQ.jsx';
import DashboardExample from '../../components/DashboardExample.jsx';

const Homepage = () => {
    return (

        <div className="home-page">
      <MainHero />
      <HowItWorks />
      <DashboardExample />
      <Features />
      <FAQ />
    </div>
    )
}

export default Homepage;
