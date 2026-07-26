export const Logo = ({ className = "h-7", variant = "full" }) => {
  const src =
    variant === "mark"
      ? "/stenodesk-mark.svg"
      : "/stenodesk-logo-full.svg";
  return <img src={src} alt="Steno Desk" className={className} data-testid="logo-img" />;
};

export default Logo;
