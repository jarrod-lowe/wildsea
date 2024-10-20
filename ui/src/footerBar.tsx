import React from 'react';
import { FormattedMessage } from 'react-intl';

const FooterBar: React.FC = () => {
  return (
    <div className="footer-bar">
      <a href="/tos.html"><FormattedMessage id="footer.privacyPolicy" /></a>
      <a href="https://github.com/jarrod-lowe/wildsea"><FormattedMessage id="footer.github" /></a>
      <a href="https://thewildsea.co.uk/"><FormattedMessage id="footer.wildseaOfficial" /></a>
      <p><FormattedMessage id="footer.disclaimer" /></p>
    </div>
  );
};

export default FooterBar;
