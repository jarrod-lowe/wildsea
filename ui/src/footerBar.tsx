import React from 'react';
import { FormattedMessage } from 'react-intl';

const FooterBar: React.FC = () => {
  return (
    <div className="footer-bar">
      <div className="footer-bar-links">
        <a href="/tos.html"><FormattedMessage id="footer.privacyPolicy" /></a>
        <a href="https://github.com/jarrod-lowe/wildsea"><FormattedMessage id="footer.github" /></a>
        <a href="https://thewildsea.co.uk/"><FormattedMessage id="footer.wildseaOfficial" /></a>
        <a href="https://www.delta-green.com/"><FormattedMessage id="footer.deltaGreenOfficial" /></a>
      </div>
      <p><FormattedMessage id="footer.disclaimer" /></p>
    </div>
  );
};

export default FooterBar;
