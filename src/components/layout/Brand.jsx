import nexaLogo from '../../assets/Nexa-Logo-Final.png';

export default function Brand() {
  return (
    <div className="brand-lockup">
      <span className="brand-logo-frame"><img className="brand-logo" src={nexaLogo} alt="" /></span>
      <div className="brand-copy">
        <div className="brand-name">Nexa Circuit LTD</div>
        <div className="brand-caption">School management</div>
      </div>
    </div>
  );
}
